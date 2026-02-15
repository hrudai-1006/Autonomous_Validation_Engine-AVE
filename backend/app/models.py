from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    npi = Column(String, unique=True, index=True)
    specialty = Column(String)
    address = Column(String)
    license = Column(String)
    
    # Status tracking
    status = Column(String, default="Pending") # Validated, Flagged, Pending
    confidence_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    validations = relationship("Validation", back_populates="provider", cascade="all, delete-orphan")

class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("providers.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    status = Column(String) # Validated, Flagged
    confidence_score = Column(Float)
    
    # Detailed results
    discrepancies = Column(JSON, default=[]) # List of strings or objects explaining issues
    extracted_data = Column(JSON) # Snapshot of what was extracted
    registry_data = Column(JSON) # Snapshot of what was found in registry
    
    provider = relationship("Provider", back_populates="validations")

class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    agent_name = Column(String) # Extraction, Enrichment, QA, Orchestrator
    message = Column(String)
    level = Column(String, default="INFO") # INFO, WARN, ERROR, SUCCESS

class SystemConfig(Base):
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, index=True)
    confidence_threshold = Column(Float, default=0.78)
    auto_approve_high_confidence = Column(Boolean, default=False)
    fuzzy_matching = Column(Boolean, default=True)
    live_registry_enrichment = Column(Boolean, default=True)
    extraction_mode = Column(String, default="batch") # "batch" or "single"

class ValidationJob(Base):
    """Tracks the progress of a validation job for UI display."""
    __tablename__ = "validation_jobs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    status = Column(String, default="running")  # running, completed, cancelled
    total_providers = Column(Integer, default=0)
    processed_providers = Column(Integer, default=0)
    current_step = Column(String, default="starting")  # extraction, enrichment, qa
    created_at = Column(DateTime, default=datetime.utcnow)
