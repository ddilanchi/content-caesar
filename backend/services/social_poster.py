"""Social media posting service.

Handles publishing content to TikTok, YouTube, Instagram, Pinterest.
Falls back to saving files locally when API access isn't available.
"""

import os
import shutil
from datetime import datetime, timezone

LOCAL_EXPORT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "exports")
os.makedirs(LOCAL_EXPORT_DIR, exist_ok=True)


async def post_to_platform(post, account, as_draft: bool = False) -> dict:
    """Route to the correct platform poster."""
    platform = account.platform.lower()

    handlers = {
        "tiktok": _post_tiktok,
        "youtube": _post_youtube,
        "instagram": _post_instagram,
        "pinterest": _post_pinterest,
    }

    handler = handlers.get(platform)
    if not handler:
        # Fallback: export file locally for manual upload
        return await _export_local(post, platform)

    return await handler(post, account, as_draft)


async def _post_tiktok(post, account, as_draft: bool) -> dict:
    """Post to TikTok via Content Posting API.

    Requires approved TikTok developer app with content.publish scope.
    Falls back to local export if not configured.
    """
    if not account.access_token:
        return await _export_local(post, "tiktok")

    # TODO: Implement TikTok Content Posting API
    # POST https://open.tiktokapis.com/v2/post/publish/video/init/
    return {"success": False, "message": "TikTok API integration pending", "fallback": "local_export"}


async def _post_youtube(post, account, as_draft: bool) -> dict:
    """Upload to YouTube via Data API v3.

    Supports Shorts (vertical <=60s) and regular videos.
    Can set as private/unlisted (draft equivalent).
    """
    if not account.access_token:
        return await _export_local(post, "youtube")

    # TODO: Implement YouTube Data API v3 upload
    # POST https://www.googleapis.com/upload/youtube/v3/videos
    return {"success": False, "message": "YouTube API integration pending", "fallback": "local_export"}


async def _post_instagram(post, account, as_draft: bool) -> dict:
    """Post to Instagram via Graph API.

    Requires Facebook Business account + Instagram Professional account.
    Supports Reels, carousel posts, single image/video.
    """
    if not account.access_token:
        return await _export_local(post, "instagram")

    # TODO: Implement Instagram Graph API
    return {"success": False, "message": "Instagram API integration pending", "fallback": "local_export"}


async def _post_pinterest(post, account, as_draft: bool) -> dict:
    """Post to Pinterest via API v5.

    Supports pins and idea pins (slideshows).
    """
    if not account.access_token:
        return await _export_local(post, "pinterest")

    # TODO: Implement Pinterest API v5
    return {"success": False, "message": "Pinterest API integration pending", "fallback": "local_export"}


async def _export_local(post, platform: str) -> dict:
    """Export file locally for manual upload when API isn't available."""
    if not post.file_path or not os.path.exists(post.file_path):
        return {"success": False, "message": "No file to export"}

    platform_dir = os.path.join(LOCAL_EXPORT_DIR, platform)
    os.makedirs(platform_dir, exist_ok=True)

    filename = os.path.basename(post.file_path)
    export_path = os.path.join(platform_dir, filename)
    shutil.copy2(post.file_path, export_path)

    return {
        "success": True,
        "method": "local_export",
        "export_path": export_path,
        "posted_at": datetime.now(timezone.utc),
        "message": f"File exported to {export_path} for manual upload to {platform}",
    }
