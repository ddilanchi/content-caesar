from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import Character

router = APIRouter()


class CharacterCreate(BaseModel):
    workspace_id: int
    name: str
    description: Optional[str] = None
    appearance: Optional[str] = None
    style: Optional[str] = None
    voice_id: Optional[str] = None
    char_meta: Optional[dict] = None


class CharacterOut(BaseModel):
    id: int
    workspace_id: int
    name: str
    description: Optional[str]
    appearance: Optional[str]
    style: Optional[str]
    voice_id: Optional[str]
    reference_images: Optional[list]
    char_meta: Optional[dict]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[CharacterOut])
async def list_characters(workspace_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(Character)
    if workspace_id:
        query = query.where(Character.workspace_id == workspace_id)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=CharacterOut)
async def create_character(data: CharacterCreate, db: AsyncSession = Depends(get_db)):
    char = Character(**data.model_dump())
    db.add(char)
    await db.commit()
    await db.refresh(char)
    return char


@router.get("/{character_id}", response_model=CharacterOut)
async def get_character(character_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Character).where(Character.id == character_id))
    char = result.scalar_one_or_none()
    if not char:
        raise HTTPException(404, "Character not found")
    return char


@router.put("/{character_id}", response_model=CharacterOut)
async def update_character(character_id: int, data: CharacterCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Character).where(Character.id == character_id))
    char = result.scalar_one_or_none()
    if not char:
        raise HTTPException(404, "Character not found")
    for key, val in data.model_dump().items():
        setattr(char, key, val)
    await db.commit()
    await db.refresh(char)
    return char


@router.delete("/{character_id}")
async def delete_character(character_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Character).where(Character.id == character_id))
    char = result.scalar_one_or_none()
    if not char:
        raise HTTPException(404, "Character not found")
    await db.delete(char)
    await db.commit()
    return {"deleted": True}
