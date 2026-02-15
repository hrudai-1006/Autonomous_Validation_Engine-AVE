from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from .database import engine, Base
from .routers import api, system

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: Clean up if needed

app = FastAPI(title="AVE - Autonomous Validation Engine", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(api.router, prefix="/api")
app.include_router(system.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "AVE Backend is Running"}
