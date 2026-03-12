"""Pinterest board import — scrape images from a public board URL and save as posts."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from models.database import get_db
from models.schemas import Post
import httpx
import os
import asyncio
from datetime import datetime, timezone

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "outputs"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

router = APIRouter()


class PinterestImportRequest(BaseModel):
    workspace_id: int
    board_url: str
    num_images: int = 20
    min_width: int = 400
    min_height: int = 400


async def _do_import(workspace_id: int, board_url: str, num_images: int, min_res: tuple, db: AsyncSession):
    """Run the Pinterest scrape + download + save posts."""
    from pinterest_dl import PinterestDL

    loop = asyncio.get_event_loop()

    def scrape():
        scraper = PinterestDL.with_api(timeout=30)
        return scraper.scrape(board_url, num=num_images, min_resolution=min_res)

    try:
        images = await loop.run_in_executor(None, scrape)
    except Exception as e:
        raise HTTPException(502, f"Pinterest scrape failed: {e}")

    saved = []
    async with httpx.AsyncClient(timeout=30) as client:
        for img in images:
            img_url = getattr(img, "src", None) or getattr(img, "url", None)
            if not img_url:
                continue
            try:
                resp = await client.get(img_url)
                resp.raise_for_status()
            except Exception:
                continue

            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S%f")
            filename = f"pinterest_{timestamp}.jpg"
            file_path = os.path.join(OUTPUT_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(resp.content)

            alt = getattr(img, "alt", None) or ""
            post = Post(
                workspace_id=workspace_id,
                content_type="image",
                prompt=alt[:500] if alt else "Imported from Pinterest",
                file_path=file_path,
                status="draft",
                generation_config={"source": "pinterest", "original_url": img_url, "board_url": board_url},
            )
            db.add(post)
            await db.commit()
            saved.append(filename)

    return saved


@router.post("/import")
async def import_from_pinterest(req: PinterestImportRequest, db: AsyncSession = Depends(get_db)):
    """Scrape images from a public Pinterest board and save them as draft posts."""
    saved = await _do_import(
        workspace_id=req.workspace_id,
        board_url=req.board_url,
        num_images=req.num_images,
        min_res=(req.min_width, req.min_height),
        db=db,
    )
    return {"imported": len(saved), "files": saved}
