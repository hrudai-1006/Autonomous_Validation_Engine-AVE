"""
AVE Crew Orchestration using CrewAI

This module defines the main Crew that coordinates all agents
to run the validation workflow.
"""

import base64
import json
from typing import Optional
from crewai import Crew, Process
from sqlalchemy.orm import Session

from .agents import extraction_agent, enrichment_agent, qa_agent
from .tasks import create_extraction_task, create_enrichment_task, create_qa_task
from ..models import Provider, Validation, AgentLog, SystemConfig, ValidationJob
from datetime import datetime


def log_to_db(db: Session, agent_name: str, message: str, level: str = "INFO"):
    """Log agent activity to database for UI streaming."""
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {agent_name}: {message}")
    log_entry = AgentLog(
        agent_name=agent_name,
        message=message,
        level=level,
        timestamp=datetime.utcnow()
    )
    db.add(log_entry)
    db.commit()


def update_job_progress(db: Session, job_id: int, **kwargs):
    """Update validation job progress."""
    job = db.query(ValidationJob).filter(ValidationJob.id == job_id).first()
    if job:
        for key, value in kwargs.items():
            setattr(job, key, value)
        db.commit()


def is_job_cancelled(db: Session, job_id: int) -> bool:
    """Check if job has been cancelled."""
    db.expire_all()  # Refresh from DB
    job = db.query(ValidationJob).filter(ValidationJob.id == job_id).first()
    return job and job.status == "cancelled"


def run_validation_crew(file_content: bytes, filename: str, db: Session, job_id: int = None) -> list:
    """
    Run the complete validation workflow using CrewAI.
    
    Args:
        file_content: Raw bytes of the uploaded file
        filename: Name of the uploaded file
        db: Database session for logging and storage
        job_id: ID of the ValidationJob for progress tracking
        
    Returns:
        List of validation results
    """
    log_to_db(db, "System", f"Received file: {filename}. Initializing agents...")
    log_to_db(db, "CrewAI Orchestrator", f"Starting validation workflow for: {filename}")
    if job_id:
        update_job_progress(db, job_id, current_step="extraction")
    
    # Get system configuration
    config = db.query(SystemConfig).first()
    extraction_mode = config.extraction_mode if config else "batch"
    confidence_threshold = config.confidence_threshold if config else 0.78

    import tempfile
    import os
    import uuid
    
    # Create temp file with unique name to prevent collisions and file system issues
    import re
    clean_filename = re.sub(r'[^a-zA-Z0-9_.-]', '_', filename)
    
    temp_dir = tempfile.gettempdir()
    unique_filename = f"{uuid.uuid4()}_{clean_filename}"
    temp_file_path = os.path.join(temp_dir, unique_filename)
    
    with open(temp_file_path, "wb") as f:
        f.write(file_content)
        
    file_path = temp_file_path
    file_size = os.path.getsize(file_path)
    log_to_db(db, "System", f"Saved temp file: {unique_filename} ({file_size} bytes)")

    
    # Check for cancellation
    if job_id and is_job_cancelled(db, job_id):
        log_to_db(db, "CrewAI Orchestrator", "Job cancelled by user.", "WARN")
        return []
        

    
    # Step 1: Extraction (Always runs now)
    log_to_db(db, "Extraction Agent", f"Processing file: {filename}")
    extraction_task = create_extraction_task(file_path, filename, extraction_mode)
    
    extraction_crew = Crew(
        agents=[extraction_agent],
        tasks=[extraction_task],
        process=Process.sequential,
        verbose=True
    )
    
    try:
        extraction_result = extraction_crew.kickoff()
        log_to_db(db, "Extraction Agent", f"Extraction complete: {str(extraction_result)[:200]}...")
    except Exception as e:
        error_msg = f"Extraction failed: {str(e)}"
        log_to_db(db, "Extraction Agent", error_msg, "ERROR")
        if "429" in str(e) or "Quota exceeded" in str(e):
             log_to_db(db, "System", "🚫 GEMINI API QUOTA EXCEEDED. Please try again later.", "ERROR")
        
        if job_id:
            update_job_progress(db, job_id, status="error", current_step="failed")
        return []
    
    # Parse extraction result
    try:
        # CrewAI returns a CrewOutput object, get the raw string
        result_str = str(extraction_result)
        # Clean up markdown if present
        if result_str.startswith("```json"):
            result_str = result_str[7:]
        if result_str.endswith("```"):
            result_str = result_str[:-3]
        extracted_providers = json.loads(result_str.strip())
        if isinstance(extracted_providers, dict):
            extracted_providers = [extracted_providers]
    except json.JSONDecodeError as e:
        log_to_db(db, "CrewAI Orchestrator", f"Failed to parse extraction result: {e}", "ERROR")
        if job_id:
            update_job_progress(db, job_id, status="completed", current_step="error")
        return []
    
    log_to_db(db, "CrewAI Orchestrator", f"Found {len(extracted_providers)} providers to validate")
    if job_id:
        update_job_progress(db, job_id, total_providers=len(extracted_providers), current_step="enrichment")
    
    # Step 2 & 3: Process each provider
    results = []
    for i, provider_data in enumerate(extracted_providers):
        # Check for cancellation before each provider
        if job_id and is_job_cancelled(db, job_id):
            log_to_db(db, "CrewAI Orchestrator", f"Job cancelled. Stopped at provider {i+1}.", "WARN")
            return results
        
        provider_name = provider_data.get('full_name')
        if not provider_name or provider_name.lower() in ['unknown', 'none', 'null', '']:
             if provider_data.get('npi'):
                 provider_name = f"Unknown Provider (NPI: {provider_data.get('npi')})"
             else:
                 provider_name = "Unknown Provider"
        
        # Update provider_data so we use this name consistently
        provider_data['full_name'] = provider_name

        log_to_db(db, "CrewAI Orchestrator", f"[{i+1}/{len(extracted_providers)}] Processing: {provider_name}")
        
        # Determine data sources based on mode
        registry_data = {}
        validation_data = {}

        npi = provider_data.get('npi')
        
        # SKIP LOGIC: If NPI is missing or obviously fake, skip the lookup
        if not npi or npi.lower() == "null" or len(str(npi)) < 5:
             log_to_db(db, "System", f"Skipping registry lookup: NPI missing or invalid ({npi})")
             registry_data = {"npi_number": npi, "registry_found": False, "status": "Not Found (No NPI)"}
        else:
            # --- DIRECT TOOL CALL (No Agent) ---
            # Agents can get stuck in loops. We use the tool directly for deterministic lookup.
            log_to_db(db, "System", f"Looking up registry data for: {provider_name} (NPI: {npi})")
            
            try:
                from ..tools.registry import NPIRegistrySearchTool
                tool = NPIRegistrySearchTool()
                registry_json = tool._run(npi)
                registry_data = json.loads(registry_json)
                log_to_db(db, "System", f"Registry lookup complete: {registry_data.get('status')}")
            except Exception as e:
                log_to_db(db, "System", f"Registry lookup failed: {e}", "ERROR")
                registry_data = {"error": str(e), "registry_found": False}
        
        # --- REAL QA ---
        # Short-circuit: If registry data is not found, we don't need the QA agent to tell us that.
        # This prevents "hanging" or "hallucinating" on empty data.
        if registry_data.get("registry_found") is False:
             log_to_db(db, "System", f"Skipping QA Agent: Registry not found. Auto-flagging.")
             validation_data = {
                "confidence_score": 0,
                "status": "Flagged",
                "discrepancies": [{"field": "NPI Registry", "penalty": 100, "extracted": str(npi), "registry": "Not Found", "reason": "Provider not found in CMS NPI Registry."}],
                "summary": "Automatic failure: Provider not found in registry."
             }
        else:
            if job_id: update_job_progress(db, job_id, processed_providers=i+1, current_step="qa")
            log_to_db(db, "QA Agent", f"Validating: {provider_name}")
            qa_task = create_qa_task(provider_data, registry_data, confidence_threshold)
            
            qa_crew = Crew(
                agents=[qa_agent],
                tasks=[qa_task],
                process=Process.sequential,
                verbose=True
            )
            
            try:
                qa_result = qa_crew.kickoff()
                log_to_db(db, "QA Agent", f"Validation complete for: {provider_name}")
                
                # Try to clean up markdown via regex first
                import re
                qa_str = str(qa_result).strip()
                # Look for JSON block
                json_match = re.search(r'\{.*\}', qa_str, re.DOTALL)
                if json_match:
                    qa_str = json_match.group(0)
                
                validation_data = json.loads(qa_str)
            except (json.JSONDecodeError, AttributeError, Exception) as e:
                log_to_db(db, "CrewAI Orchestrator", f"Failed to parse QA output: {str(e)}", "ERROR")
                validation_data = {
                    "confidence_score": 0,
                    "status": "Flagged",
                    "discrepancies": [{"field": "System Error", "penalty": 100, "extracted": "Invalid Format", "registry": "N/A", "reason": "AI validation response was not valid JSON."}],
                    "summary": "Validation parsing failed due to invalid AI response."
                }
        
        # Rate limit protection for batch mode
        import time
        time.sleep(1)
        
        # Save to database (Upsert Logic)
        # Ensure full_name is not None to avoid API crashes
        db_full_name = provider_data.get('full_name') or "Unknown"
        npi_value = provider_data.get('npi')
        
        provider = None
        if npi_value:
            provider = db.query(Provider).filter(Provider.npi == npi_value).first()
        
        if provider:
            # Update existing provider
            provider.full_name = db_full_name
            provider.specialty = provider_data.get('specialty')
            provider.address = provider_data.get('address')
            provider.license = provider_data.get('license')
            provider.status = validation_data.get('status', 'Flagged')
            provider.confidence_score = validation_data.get('confidence_score', 0)
            provider.last_updated = datetime.utcnow()
            log_to_db(db, "CrewAI Orchestrator", f"Updating existing provider: {db_full_name} (NPI: {npi_value})")
        else:
            # Create new provider
            provider = Provider(
                full_name=db_full_name,
                npi=npi_value,
                specialty=provider_data.get('specialty'),
                address=provider_data.get('address'),
                license=provider_data.get('license'),
                status=validation_data.get('status', 'Flagged'),
                confidence_score=validation_data.get('confidence_score', 0)
            )
            db.add(provider)
            log_to_db(db, "CrewAI Orchestrator", f"Creating new provider: {db_full_name}")
            
        db.flush()  # Get the ID (or ensure update is staged)
        
        validation = Validation(
            provider_id=provider.id,
            extracted_data=provider_data,
            registry_data=registry_data,
            discrepancies=validation_data.get('discrepancies', []),
            confidence_score=validation_data.get('confidence_score', 0),
            status=validation_data.get('status', 'Flagged')
        )
        db.add(validation)
        db.commit()
        
        provider.latest_validation_id = validation.id
        db.commit()
        
        results.append(validation_data)
        log_to_db(db, "CrewAI Orchestrator", f"Saved: {provider_name} -> {validation_data.get('status')} ({validation_data.get('confidence_score')}%)")
        
        # Update progress
        if job_id:
            update_job_progress(db, job_id, processed_providers=i+1, current_step="qa" if i < len(extracted_providers)-1 else "complete")
    
    # Mark job as completed
    if job_id:
        update_job_progress(db, job_id, status="completed", current_step="complete")
    
    log_to_db(db, "CrewAI Orchestrator", f"Workflow complete. Processed {len(results)}/{len(extracted_providers)} providers.")
    return results
