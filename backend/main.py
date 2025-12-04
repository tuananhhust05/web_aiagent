from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

from app.routers import auth, contacts, users, crm, offers, calls, webhook, campaigns, integrations, groups, contacts_import, stats, rag, emails, telegram, whatsapp, inbox, convention_activities, deals, campaign_goals, renewals, csm, upsell, workflows, gmail, campaign_workflow_scripts
from app.core.config import settings
from app.core.database import init_db, close_db
from app.services.scheduler import start_scheduler, stop_scheduler
from app.services.telegram_listener import telegram_listener

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🔧 [DEBUG] FastAPI lifespan startup")
    await init_db()
    print("🔧 [DEBUG] Database initialized")
    await telegram_listener.start()
    print("🔧 [DEBUG] Telegram listener started")
    
    # Start campaign scheduler
    # TEMPORARILY DISABLED - Uncomment to enable scheduler
    # print("🔧 [DEBUG] Starting scheduler...")
    # # Start scheduler directly in background
    # from app.services.scheduler import scheduler
    # await scheduler.initialize()
    # scheduler_task = asyncio.create_task(scheduler.start())
    # print(f"🔧 [DEBUG] Scheduler task created: {scheduler_task}")
    # 
    # # Ensure the task is scheduled
    # await asyncio.sleep(0.1)
    # print(f"🔧 [DEBUG] Scheduler task status: {scheduler_task.done()}")
    print("🔧 [DEBUG] Scheduler is temporarily disabled")
    
    yield
    
    # Shutdown
    print("🔧 [DEBUG] FastAPI lifespan shutdown")
    await telegram_listener.stop()
    # await stop_scheduler()
    # scheduler_task.cancel()
    # try:
    #     await scheduler_task
    # except asyncio.CancelledError:
    #     pass
    # await close_db()

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
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(contacts.router, prefix="/api/contacts", tags=["Contacts"])
app.include_router(crm.router, prefix="/api/crm", tags=["CRM Integration"])
app.include_router(offers.router, prefix="/api/offers", tags=["Offers"])
app.include_router(calls.router, prefix="/api/calls", tags=["Calls & Analytics"])
app.include_router(webhook.router, prefix="/api/webhook", tags=["Webhooks"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(groups.router, prefix="/api/groups", tags=["Groups"])
app.include_router(contacts_import.router, prefix="/api/contacts", tags=["Contacts Import"])
app.include_router(stats.router, prefix="/api/stats", tags=["Statistics"])
app.include_router(rag.router, prefix="/api/rag", tags=["RAG & Knowledge Base"])
app.include_router(emails.router, prefix="/api/emails", tags=["Email Marketing"])
app.include_router(telegram.router, tags=["Telegram"])
app.include_router(whatsapp.router, tags=["WhatsApp"])
app.include_router(inbox.router, prefix="/api/inbox", tags=["Inbox"])
app.include_router(convention_activities.router, prefix="/api/convention-activities", tags=["Convention Activities"])
app.include_router(deals.router, prefix="/api/deals", tags=["Deals"])
app.include_router(campaign_goals.router, prefix="/api/campaign-goals", tags=["Campaign Goals"])
app.include_router(renewals.router, prefix="/api/renewals", tags=["Renewals"])
app.include_router(csm.router, prefix="/api/csm", tags=["Customer Success Management"])
app.include_router(upsell.router, prefix="/api/upsell", tags=["Up/Cross Sell"])
app.include_router(workflows.router, prefix="/api/workflows", tags=["Workflows"])
app.include_router(campaign_workflow_scripts.router, prefix="/api/campaign-workflow-scripts", tags=["Campaign Workflow Scripts"])
app.include_router(gmail.router, prefix="/api/gmail", tags=["Gmail"])

@app.get("/")
async def root():
    return {"message": "AgentVoice API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 