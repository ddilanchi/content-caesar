from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from models.database import init_db
from api import workspaces, characters, posts, tools, generation, social


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
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


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
