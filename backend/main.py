from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

from app.routers import auth, contacts, users, crm, offers, calls, webhook, campaigns, integrations, groups, contacts_import, stats, rag, emails, telegram, whatsapp, inbox, convention_activities, deals, campaign_goals, renewals, csm, upsell, workflows, gmail, campaign_workflow_scripts, companies, uploads

# Import pipelines separately with error handling
try:
    from app.routers import pipelines
    print(f"✅ [DEBUG] pipelines router loaded successfully: {pipelines.router}")
except Exception as e:
    print(f"❌ [ERROR] Failed to import pipelines router: {e}")
    import traceback
    traceback.print_exc()
    pipelines = None
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
    
    # Start Telegram listener with error handling
    try:
        await telegram_listener.start()
        print("🔧 [DEBUG] Telegram listener started")
    except Exception as e:
        print(f"⚠️ [WARNING] Telegram listener failed to start: {e}")
        print("⚠️ [WARNING] App will continue without Telegram listener")
    
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
    try:
        await telegram_listener.stop()
    except Exception as e:
        print(f"⚠️ [WARNING] Error stopping Telegram listener: {e}")
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

# File upload static directory (for URLs starting with `/upload`)
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files so `/upload/<filename>` is publicly accessible
app.mount("/upload", StaticFiles(directory=UPLOAD_DIR), name="upload")

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
app.include_router(companies.router, prefix="/api", tags=["Companies"])
app.include_router(uploads.router, tags=["File Upload"])

# Add pipelines router if import succeeded
# if pipelines:
app.include_router(pipelines.router, prefix="/api/pipelines", tags=["Sales Pipelines"])
print("✅ [DEBUG] Pipelines router registered at /api/pipelines")
# else:
#     print("⚠️ [WARNING] Pipelines router not loaded - /api/pipelines will be unavailable")

@app.get("/")
async def root():
    return {"message": "AgentVoice API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# DEBUG: Direct test endpoint for pipelines
@app.get("/api/pipelines-test-direct")
async def pipelines_test_direct():
    print("🔥 [MAIN.PY] /api/pipelines-test-direct called!")
    return {"status": "ok", "message": "Direct endpoint from main.py works!", "pipelines_loaded": pipelines is not None}

@app.get("/debug/routes")
async def debug_routes():
    """List all registered routes"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": list(route.methods) if hasattr(route, 'methods') else None
            })
    return {"total_routes": len(routes), "routes": routes} 