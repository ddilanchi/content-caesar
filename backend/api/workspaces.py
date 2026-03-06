from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import Workspace

router = APIRouter()


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[WorkspaceOut])
async def list_workspaces(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace))
    return result.scalars().all()


@router.post("/", response_model=WorkspaceOut)
async def create_workspace(data: WorkspaceCreate, db: AsyncSession = Depends(get_db)):
    ws = Workspace(name=data.name, description=data.description)
    db.add(ws)
    await db.commit()
    await db.refresh(ws)
    return ws


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(workspace_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(404, "Workspace not found")
    return ws


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    ws = result.scalar_one_or_none()
    if not ws:
        raise HTTPException(404, "Workspace not found")
    await db.delete(ws)
    await db.commit()
    return {"deleted": True}
