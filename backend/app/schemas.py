from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# Provider Schemas
class ProviderBase(BaseModel):
    full_name: str
    npi: str
    specialty: Optional[str] = None
    address: Optional[str] = None
    license: Optional[str] = None

class ProviderCreate(ProviderBase):
    pass

class ProviderResponse(ProviderBase):
    id: int
    status: str
    confidence_score: float
    last_updated: datetime
    latest_validation_id: int | None = None

    class Config:
        from_attributes = True

# Validation Schemas
class ValidationBase(BaseModel):
    status: str
    confidence_score: float
    discrepancies: List[Any] = []
    extracted_data: Optional[dict] = None
    registry_data: Optional[dict] = None

class ValidationResponse(ValidationBase):
    id: int
    provider_id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Agent Log Schema
class AgentLogCreate(BaseModel):
    agent_name: str
    message: str
    level: str = "INFO"

class AgentLogResponse(AgentLogCreate):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# Config Schema
class SystemConfigBase(BaseModel):
    confidence_threshold: float
    auto_approve_high_confidence: bool
    fuzzy_matching: bool
    live_registry_enrichment: bool
    extraction_mode: str = "batch"

class SystemConfigResponse(SystemConfigBase):
    id: int
    class Config:
        from_attributes = True

class SystemConfigUpdate(BaseModel):
    confidence_threshold: Optional[float] = None
    auto_approve_high_confidence: Optional[bool] = None
    fuzzy_matching: Optional[bool] = None
    live_registry_enrichment: Optional[bool] = None
    extraction_mode: Optional[str] = None
    extraction_mode: Optional[str] = None
