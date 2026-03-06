from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import SocialAccount, Post
from services.social_poster import post_to_platform

router = APIRouter()


class SocialAccountCreate(BaseModel):
    workspace_id: int
    platform: str
    account_name: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    extra_config: Optional[dict] = None


class SocialAccountOut(BaseModel):
    id: int
    workspace_id: int
    platform: str
    account_name: str

    class Config:
        from_attributes = True


@router.get("/accounts", response_model=list[SocialAccountOut])
async def list_accounts(workspace_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(SocialAccount)
    if workspace_id:
        query = query.where(SocialAccount.workspace_id == workspace_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/accounts", response_model=SocialAccountOut)
async def add_account(data: SocialAccountCreate, db: AsyncSession = Depends(get_db)):
    account = SocialAccount(**data.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


@router.post("/post/{post_id}")
async def publish_post(post_id: int, platform: str, as_draft: bool = False,
                       db: AsyncSession = Depends(get_db)):
    """Publish a post to a specific platform."""
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(404, "Post not found")
    if not post.file_path:
        raise HTTPException(400, "Post has no generated content yet")

    # Find the social account for this workspace + platform
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.workspace_id == post.workspace_id,
            SocialAccount.platform == platform,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, f"No {platform} account connected for this workspace")

    publish_result = await post_to_platform(post, account, as_draft=as_draft)

    if publish_result.get("success"):
        post.status = "posted"
        post.posted_at = publish_result.get("posted_at")
        await db.commit()

    return publish_result
