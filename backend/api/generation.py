from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import Post, Character
from services.content_generator import generate_content

router = APIRouter()


class GenerationRequest(BaseModel):
    workspace_id: int
    character_id: Optional[int] = None
    content_type: str  # video, slideshow, image
    prompt: str
    style: Optional[str] = None  # casual_phone, professional, cinematic, etc.
    duration: Optional[int] = 15  # seconds for video
    aspect_ratio: Optional[str] = "9:16"  # 9:16 for shorts, 16:9 for youtube, 1:1 for ig
    add_captions: bool = True
    caption_style: Optional[str] = "word_by_word"  # word_by_word, sentence, none
    music_track: Optional[str] = None
    video_artifacts: bool = True  # Add casual phone-video artifacts


@router.post("/")
async def generate(req: GenerationRequest, db: AsyncSession = Depends(get_db)):
    """Generate content based on the request."""
    character = None
    if req.character_id:
        result = await db.execute(select(Character).where(Character.id == req.character_id))
        character = result.scalar_one_or_none()
        if not character:
            raise HTTPException(404, "Character not found")

    output = await generate_content(req, character)

    # Create a post record
    post = Post(
        workspace_id=req.workspace_id,
        character_id=req.character_id,
        content_type=req.content_type,
        prompt=req.prompt,
        file_path=output.get("file_path"),
        generation_config=req.model_dump(),
        status="draft",
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {"post_id": post.id, "file_path": output.get("file_path"), "status": "generated"}
