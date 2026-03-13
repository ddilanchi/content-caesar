from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from models.database import get_db
from models.schemas import Post

router = APIRouter()


class PostCreate(BaseModel):
    workspace_id: int
    character_id: Optional[int] = None
    title: Optional[str] = None
    content_type: str
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
    cost_usd: Optional[float]
    cost_breakdown: Optional[dict]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# Must be before /{post_id} to avoid route conflict
@router.get("/costs/summary")
async def cost_summary(workspace_id: int, db: AsyncSession = Depends(get_db)):
    """Return total and period-based cost breakdowns for a workspace."""
    result = await db.execute(
        select(Post).where(Post.workspace_id == workspace_id, Post.cost_usd.isnot(None))
    )
    posts = result.scalars().all()

    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = day_start - timedelta(days=now.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def _by_type(p_list):
        out = {}
        for p in p_list:
            out[p.content_type] = out.get(p.content_type, 0) + (p.cost_usd or 0)
        return {k: round(v, 4) for k, v in out.items()}

    def bucket(p_list, since):
        relevant = [p for p in p_list if p.created_at and p.created_at.replace(tzinfo=timezone.utc) >= since]
        return {"total_usd": round(sum(p.cost_usd for p in relevant), 4), "count": len(relevant), "by_type": _by_type(relevant)}

    return {
        "all_time": {"total_usd": round(sum(p.cost_usd for p in posts), 4), "count": len(posts), "by_type": _by_type(posts)},
        "today": bucket(posts, day_start),
        "this_week": bucket(posts, week_start),
        "this_month": bucket(posts, month_start),
    }


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
