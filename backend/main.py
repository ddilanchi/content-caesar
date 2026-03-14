from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from sqlalchemy import select
from models.database import init_db, async_session
from models.schemas import ToolConfig
from api import workspaces, characters, posts, tools, generation, social, pinterest, scripts
import config
import os


async def _seed_tool(tool_name: str, category: str, api_key: str):
    """Upsert a tool API key from .env into tool_configs if not already set."""
    if not api_key:
        return
    async with async_session() as db:
        result = await db.execute(select(ToolConfig).where(ToolConfig.tool_name == tool_name))
        existing = result.scalar_one_or_none()
        if not existing:
            db.add(ToolConfig(tool_name=tool_name, category=category, api_key=api_key, is_active=True))
            await db.commit()
        elif not existing.api_key:
            existing.api_key = api_key
            await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await _seed_tool("gemini", "llm", config.GEMINI_API_KEY)
    await _seed_tool("kling", "video", config.FAL_API_KEY)
    await _seed_tool("elevenlabs", "voice", config.ELEVENLABS_API_KEY)
    yield


app = FastAPI(title="Content Caesar", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workspaces.router, prefix="/api/workspaces", tags=["workspaces"])
app.include_router(characters.router, prefix="/api/characters", tags=["characters"])
app.include_router(posts.router, prefix="/api/posts", tags=["posts"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(generation.router, prefix="/api/generate", tags=["generation"])
app.include_router(social.router, prefix="/api/social", tags=["social"])
app.include_router(pinterest.router, prefix="/api/pinterest", tags=["pinterest"])
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])

# Serve generated media files
_outputs_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "outputs"))
os.makedirs(_outputs_dir, exist_ok=True)
app.mount("/api/media", StaticFiles(directory=_outputs_dir), name="media")


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
