from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from motor.motor_asyncio import AsyncIOMotorClient

from app.routers import auth, contacts, users, crm, offers, calls
from app.core.config import settings
from app.core.database import init_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    await close_db()

app = FastAPI(
    title="AgentVoice API",
    description="Voice AI Agent Platform API",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False  # Disable automatic redirect from /path to /path/
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(crm.router, prefix="/api/crm", tags=["CRM Integration"])
app.include_router(offers.router, prefix="/api/offers", tags=["Offers"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls & Analytics"])

@app.get("/")
async def root():
    return {"message": "AgentVoice API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 