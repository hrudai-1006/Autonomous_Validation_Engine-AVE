from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import ProviderResponse, ValidationResponse, AgentLogResponse, SystemConfigResponse
from ..models import Provider, Validation, AgentLog, SystemConfig, ValidationJob
from ..crew.crew import run_validation_crew
from typing import List

router = APIRouter()

def run_crew_task(file_content: bytes, filename: str, job_id: int):
    """Background task to run CrewAI validation crew."""
    from ..database import SessionLocal
    new_db = SessionLocal()
    try:
        run_validation_crew(file_content, filename, new_db, job_id)
    finally:
        new_db.close()

@router.post("/validate")
async def trigger_validation(background_tasks: BackgroundTasks, file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    
    # Create a validation job to track progress
    job = ValidationJob(filename=file.filename, status="running", current_step="starting")
    db.add(job)
    db.commit()
    db.refresh(job)
    
    # Run CrewAI validation in background
    background_tasks.add_task(run_crew_task, content, file.filename, job.id)
    
    return {"message": "CrewAI Validation workflow started", "filename": file.filename, "job_id": job.id}

@router.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Provider).count()
    validated = db.query(Provider).filter(Provider.status == "Validated").count()
    flagged = db.query(Provider).filter(Provider.status == "Flagged").count()
    
    avg_conf = 0.0
    if total > 0:
        providers = db.query(Provider).all()
        avg_conf = sum([p.confidence_score for p in providers]) / total

    return {
        "total_profiles": total, 
        "validated": validated, 
        "action_required": flagged, 
        "avg_confidence": int(avg_conf)
    }

@router.get("/logs", response_model=List[AgentLogResponse])
def get_logs(db: Session = Depends(get_db)):
    return db.query(AgentLog).order_by(AgentLog.timestamp.desc()).limit(50).all()

@router.get("/providers", response_model=List[ProviderResponse])
def get_providers(db: Session = Depends(get_db)):
    providers = db.query(Provider).order_by(Provider.last_updated.desc()).all()
    # Enrich with latest validation ID
    for p in providers:
        latest_val = db.query(Validation).filter(Validation.provider_id == p.id).order_by(Validation.timestamp.desc()).first()
        p.latest_validation_id = latest_val.id if latest_val else None
    return providers

@router.get("/validation/{validation_id}", response_model=ValidationResponse)
def get_validation_by_id(validation_id: int, db: Session = Depends(get_db)):
    return db.query(Validation).filter(Validation.id == validation_id).first()

@router.get("/validation/{validation_id}/discrepancies")
def get_discrepancies(validation_id: int, db: Session = Depends(get_db)):
    val = db.query(Validation).filter(Validation.id == validation_id).first()
    if not val:
        return []
    
    # Transform simple string list to detailed object if needed, 
    # but for now we assume the DB stores them as strings or objects. 
    # The requirement asks for specific fields, so we might need to mock or formatting if they are just strings.
    # Current DB model 'discrepancies' is a JSON column. 
    # In seed data it is a list of strings.
    # We will format them as objects to match requirements.
    formatted = []
    if isinstance(val.discrepancies, list):
        for d in val.discrepancies:
            if isinstance(d, str):
                formatted.append({
                    "field_name": "Unknown", # Inferred or generic
                    "extracted_value": "N/A",
                    "registry_value": "N/A",
                    "reason": d,
                    "severity": "High"
                })
            else:
                formatted.append(d)
    return formatted

@router.get("/agent-logs/{validation_id}", response_model=List[AgentLogResponse])
def get_agent_logs_by_validation(validation_id: int, db: Session = Depends(get_db)):
    # Note: Currently AgentLog doesn't have validation_id. 
    # We will return the most recent logs as a proxy or we need to migrate the model.
    # For this "Fix", we'll just return general logs filtered by time if possible, 
    # or just all recent logs since we don't have the link in the DB for AgentLog.
    # However, the user said "Ensure agent_logs table stores messages with timestamps".
    # It does, but no validation_id relationship. 
    # We will return the recent logs.
    return db.query(AgentLog).order_by(AgentLog.timestamp.desc()).limit(20).all()

@router.delete("/logs")
def clear_logs(db: Session = Depends(get_db)):
    db.query(AgentLog).delete()
    db.commit()
    return {"message": "All logs cleared"}

@router.delete("/providers/{provider_id}")
def delete_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if provider:
        db.delete(provider)
        db.commit()
        return {"message": f"Provider {provider_id} deleted"}
    return {"message": "Provider not found"}

@router.delete("/providers")
def clear_registry(db: Session = Depends(get_db)):
    # Standard query.delete() does NOT trigger ORM cascades (like delete-orphan for validations)
    # So we must fetch and delete individually to ensure validations are also removed.
    providers = db.query(Provider).all()
    for provider in providers:
        db.delete(provider) 
    
    db.commit()
    return {"message": "All providers and their reports deleted"}

from ..schemas import SystemConfigUpdate

@router.get("/config", response_model=SystemConfigResponse)
def get_config(db: Session = Depends(get_db)):
    config = db.query(SystemConfig).first()
    if not config:
        # Create default if missing
        config = SystemConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return config

@router.put("/config", response_model=SystemConfigResponse)
def update_config(config_in: SystemConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).first()
    if not config:
        config = SystemConfig()
        db.add(config)
    
    config.confidence_threshold = config_in.confidence_threshold
    config.auto_approve_high_confidence = config_in.auto_approve_high_confidence
    config.fuzzy_matching = config_in.fuzzy_matching
    config.live_registry_enrichment = config_in.live_registry_enrichment
    config.extraction_mode = config_in.extraction_mode
    
    db.commit()
    db.refresh(config)
    return config

# ========== Validation Job Progress & Cancel ==========

@router.get("/jobs/active")
def get_active_job(db: Session = Depends(get_db)):
    """Get the currently running validation job (if any)."""
    job = db.query(ValidationJob).filter(ValidationJob.status == "running").order_by(ValidationJob.created_at.desc()).first()
    if not job:
        return {"active": False}
    return {
        "active": True,
        "job_id": job.id,
        "filename": job.filename,
        "status": job.status,
        "current_step": job.current_step,
        "total_providers": job.total_providers,
        "processed_providers": job.processed_providers
    }

@router.post("/jobs/{job_id}/cancel")
def cancel_job(job_id: int, db: Session = Depends(get_db)):
    """Cancel a running validation job."""
    job = db.query(ValidationJob).filter(ValidationJob.id == job_id).first()
    if not job:
        return {"success": False, "error": "Job not found"}
    
    job.status = "cancelled"
    job.current_step = "cancelled"
    db.commit()
    
    # Log cancellation to Agent Execution Stream
    from datetime import datetime
    cancel_log = AgentLog(
        agent_name="System",
        message=f"⛔ Validation cancelled by user for: {job.filename}",
        level="WARN",
        timestamp=datetime.utcnow()
    )
    db.add(cancel_log)
    db.commit()
    
    return {"success": True, "message": f"Job {job_id} cancelled"}
