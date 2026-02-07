from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_db, close_db
from app.api import auth, onboarding, brief, checkin, nudges, knowledge, admin, integrations
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    start_scheduler()
    yield
    stop_scheduler()
    await close_db()


app = FastAPI(title="Accountability AI", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(onboarding.router)
app.include_router(brief.router)
app.include_router(checkin.router)
app.include_router(nudges.router)
app.include_router(knowledge.router)
app.include_router(admin.router)
app.include_router(integrations.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
