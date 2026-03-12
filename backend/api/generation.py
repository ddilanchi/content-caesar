from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import Post, Character, ToolConfig
from services.content_generator import generate_content

router = APIRouter()


class GenerationRequest(BaseModel):
    workspace_id: int
    character_id: Optional[int] = None
    content_type: str  # video, slideshow, image
    prompt: str
    style: Optional[str] = None
    duration: Optional[int] = 15
    aspect_ratio: Optional[str] = "9:16"
    add_captions: bool = True
    caption_style: Optional[str] = "word_by_word"
    music_track: Optional[str] = None
    video_artifacts: bool = True


@router.post("/")
async def generate(req: GenerationRequest, db: AsyncSession = Depends(get_db)):
    """Generate content. Creates post immediately as 'generating', updates when done."""
    character = None
    if req.character_id:
        result = await db.execute(select(Character).where(Character.id == req.character_id))
        character = result.scalar_one_or_none()
        if not character:
            raise HTTPException(404, "Character not found")

    # Collect configured tool API keys
    gemini_result = await db.execute(select(ToolConfig).where(ToolConfig.tool_name == "gemini"))
    gemini_tool = gemini_result.scalar_one_or_none()
    kling_result = await db.execute(select(ToolConfig).where(ToolConfig.tool_name == "kling"))
    kling_tool = kling_result.scalar_one_or_none()
    tools = {
        "gemini_api_key": gemini_tool.api_key if gemini_tool else None,
        "fal_api_key": kling_tool.api_key if kling_tool else None,
    }

    # Create post immediately so UI can show it as pending
    post = Post(
        workspace_id=req.workspace_id,
        character_id=req.character_id,
        content_type=req.content_type,
        prompt=req.prompt,
        generation_config=req.model_dump(),
        status="generating",
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    try:
        output = await generate_content(req, character, tools=tools)
        gen_status = output.get("status", "unknown")

        if gen_status == "error":
            post.status = "failed"
            post.generation_config = {**(post.generation_config or {}), "error": output.get("error")}
        else:
            post.status = "draft" if gen_status == "generated" else "failed"
            post.file_path = output.get("file_path")
    except Exception as e:
        post.status = "failed"
        post.generation_config = {**(post.generation_config or {}), "error": str(e)}

    await db.commit()
    await db.refresh(post)

    return {"post_id": post.id, "file_path": post.file_path, "status": post.status}
