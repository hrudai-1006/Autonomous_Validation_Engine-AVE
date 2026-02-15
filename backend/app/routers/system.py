from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from ..database import get_db
import os
import google.generativeai as genai
from dotenv import load_dotenv, set_key

router = APIRouter()

class SecretsUpdate(BaseModel):
    gemini_api_key: str
    database_url: str

class SystemStatus(BaseModel):
    database: str # "connected" | "error"
    gemini: str # "connected" | "error"
    database_message: str | None = None
    gemini_message: str | None = None
    masked_gemini_key: str | None = None
    masked_db_url: str | None = None

@router.get("/system/status", response_model=SystemStatus)
def get_system_status(db: Session = Depends(get_db)):
    status = {
        "database": "error",
        "gemini": "error",
        "database_message": None,
        "gemini_message": None,
        "masked_gemini_key": None,
        "masked_db_url": None
    }

    # 1. Check Database
    try:
        db.execute(text("SELECT 1"))
        status["database"] = "connected"
    except Exception as e:
        status["database_message"] = str(e)

    # 2. Check Gemini
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key:
        status["masked_gemini_key"] = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "***"
        try:
            genai.configure(api_key=api_key)
            # Lightweight call to list models to verify auth
            list(genai.list_models(page_size=1)) 
            status["gemini"] = "connected"
        except Exception as e:
            status["gemini_message"] = str(e)
    else:
        status["gemini_message"] = "No API Key found in environment"

    # Mask DB URL
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        # Simple mask: show schema and maybe host if possible, but safe default:
        status["masked_db_url"] = "configured (hidden)"
            
    return status

@router.post("/system/secrets")
def update_secrets(secrets: SecretsUpdate):
    env_path = ".env"
    
    # We use dotenv set_key to update properly preserving other vars if any
    # If .env doesn't exist, create it
    if not os.path.exists(env_path):
        with open(env_path, "w") as f:
            f.write("")
    
    try:
        # Update keys
        set_key(env_path, "GEMINI_API_KEY", secrets.gemini_api_key)
        set_key(env_path, "DATABASE_URL", secrets.database_url)
        
        # Force reload in current process for immediate effect (partial)
        os.environ["GEMINI_API_KEY"] = secrets.gemini_api_key
        os.environ["DATABASE_URL"] = secrets.database_url
        
        # Note: Database engine is initialized at startup. 
        # A full restart is usually required for DB URL changes to fully take effect in the app's pool.
        # But for the purpose of the UI "Save", we confirm it's written.
        
        return {"message": "Secrets updated. Please restart the backend if Database URL was changed."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update .env: {str(e)}")
