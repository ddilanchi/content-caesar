from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.database import get_db
from models.schemas import Post

router = APIRouter()


class PostCreate(BaseModel):
    workspace_id: int
    character_id: Optional[int] = None
    title: Optional[str] = None
    content_type: str  # video, slideshow, image
    prompt: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[str] = None
    music_track: Optional[str] = None
    post_as_draft: bool = False
    scheduled_at: Optional[datetime] = None
    target_platforms: Optional[list[str]] = None


class PostOut(BaseModel):
    id: int
    workspace_id: int
    character_id: Optional[int]
    title: Optional[str]
    content_type: str
    prompt: Optional[str]
    caption: Optional[str]
    hashtags: Optional[str]
    music_track: Optional[str]
    file_path: Optional[str]
    status: str
    post_as_draft: bool
    scheduled_at: Optional[datetime]
    posted_at: Optional[datetime]
    target_platforms: Optional[list[str]]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[PostOut])
async def list_posts(workspace_id: Optional[int] = None, status: Optional[str] = None,
                     db: AsyncSession = Depends(get_db)):
    query = select(Post)
    if workspace_id:
        query = query.where(Post.workspace_id == workspace_id)
    if status:
        query = query.where(Post.status == status)
    query = query.order_by(Post.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=PostOut)
async def create_post(data: PostCreate, db: AsyncSession = Depends(get_db)):
    post = Post(**data.model_dump())
    if data.scheduled_at:
        post.status = "scheduled"
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.get("/{post_id}", response_model=PostOut)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    return post


@router.put("/{post_id}", response_model=PostOut)
async def update_post(post_id: int, data: PostCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    for key, val in data.model_dump().items():
        setattr(post, key, val)
    await db.commit()
    await db.refresh(post)
    return post


@router.delete("/{post_id}")
async def delete_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    await db.delete(post)
    await db.commit()
    return {"deleted": True}
