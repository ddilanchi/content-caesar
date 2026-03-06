"""Post scheduler — checks for scheduled posts and publishes them at the right time."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from datetime import datetime, timezone
from models.database import async_session
from models.schemas import Post, SocialAccount
from services.social_poster import post_to_platform

scheduler = AsyncIOScheduler()


async def check_scheduled_posts():
    """Find posts that are due and publish them."""
    async with async_session() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Post).where(
                Post.status == "scheduled",
                Post.scheduled_at <= now,
                Post.file_path.isnot(None),
            )
        )
        posts = result.scalars().all()

        for post in posts:
            if not post.target_platforms:
                continue

            for platform in post.target_platforms:
                account_result = await db.execute(
                    select(SocialAccount).where(
                        SocialAccount.workspace_id == post.workspace_id,
                        SocialAccount.platform == platform,
                    )
                )
                account = account_result.scalar_one_or_none()
                if account:
                    publish_result = await post_to_platform(
                        post, account, as_draft=post.post_as_draft
                    )
                    if publish_result.get("success"):
                        post.status = "posted"
                        post.posted_at = now

            await db.commit()


def start_scheduler():
    """Start the scheduler to check for due posts every minute."""
    scheduler.add_job(check_scheduled_posts, "interval", minutes=1, id="post_checker")
    scheduler.start()


def stop_scheduler():
    scheduler.shutdown()
