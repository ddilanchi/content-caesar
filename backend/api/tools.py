from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import ToolConfig
from services.sota_checker import check_sota

router = APIRouter()


class ToolConfigCreate(BaseModel):
    tool_name: str
    category: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    config: Optional[dict] = None


class ToolConfigOut(BaseModel):
    id: int
    tool_name: str
    category: str
    is_active: bool
    config: Optional[dict]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ToolConfigOut])
async def list_tools(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ToolConfig))
    return result.scalars().all()


@router.post("/", response_model=ToolConfigOut)
async def add_tool(data: ToolConfigCreate, db: AsyncSession = Depends(get_db)):
    tool = ToolConfig(**data.model_dump())
    db.add(tool)
    await db.commit()
    await db.refresh(tool)
    return tool


@router.put("/{tool_id}", response_model=ToolConfigOut)
async def update_tool(tool_id: int, data: ToolConfigCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ToolConfig).where(ToolConfig.id == tool_id))
    tool = result.scalar_one_or_none()
    if not tool:
        raise HTTPException(404, "Tool not found")
    for key, val in data.model_dump().items():
        setattr(tool, key, val)
    await db.commit()
    await db.refresh(tool)
    return tool


@router.get("/sota-check")
async def sota_check(db: AsyncSession = Depends(get_db)):
    """Query LLM for current SOTA AI content generation tools."""
    result = await db.execute(select(ToolConfig).where(ToolConfig.tool_name == "gemini"))
    gemini = result.scalar_one_or_none()
    api_key = gemini.api_key if gemini else None
    report = await check_sota(api_key)
    return {"report": report}
