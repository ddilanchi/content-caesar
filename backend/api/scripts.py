from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from models.database import get_db
from models.schemas import ToolConfig

router = APIRouter()


class HookRequest(BaseModel):
    product_name: str
    product_description: str
    target_audience: Optional[str] = None
    platform: Optional[str] = "tiktok"


class ScriptRequest(BaseModel):
    product_name: str
    product_description: str
    target_audience: Optional[str] = None
    format: Optional[str] = "ugc_ad"  # ugc_ad, testimonial, tutorial, problem_solution
    duration_sec: Optional[int] = 30
    platform: Optional[str] = "tiktok"


async def _get_gemini_key(db: AsyncSession) -> str:
    result = await db.execute(select(ToolConfig).where(ToolConfig.tool_name == "gemini"))
    gemini = result.scalar_one_or_none()
    if not gemini or not gemini.api_key:
        raise HTTPException(400, "Gemini API key not configured")
    return gemini.api_key


@router.post("/hooks")
async def generate_hooks(req: HookRequest, db: AsyncSession = Depends(get_db)):
    """Generate 6 viral hook options for a product using Gemini."""
    api_key = await _get_gemini_key(db)

    from google import genai

    client = genai.Client(api_key=api_key)

    audience_line = f"Target audience: {req.target_audience}" if req.target_audience else ""

    prompt = f"""You are a viral {req.platform.upper()} content strategist. Generate 6 different viral opening hooks for a short-form video ad.

Product: {req.product_name}
Description: {req.product_description}
{audience_line}

Rules:
- Each hook must be under 12 words
- Must stop the scroll in the first 2 seconds
- Use different hook styles: curiosity, controversy, relatability, shock, FOMO, transformation
- Write for spoken word (these will be said out loud or shown as text)
- Do NOT mention the brand name in the hook itself
- No hashtags, no emojis

Return ONLY a JSON array of 6 strings, nothing else. Example format:
["Hook one here", "Hook two here", "Hook three here", "Hook four here", "Hook five here", "Hook six here"]"""

    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )

    text = response.text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    import json
    try:
        hooks = json.loads(text)
    except Exception:
        raise HTTPException(500, f"Failed to parse hooks response: {text}")

    return {"hooks": hooks}


@router.post("/script")
async def generate_script(req: ScriptRequest, db: AsyncSession = Depends(get_db)):
    """Generate a full UGC video script using Gemini."""
    api_key = await _get_gemini_key(db)

    from google import genai

    client = genai.Client(api_key=api_key)

    audience_line = f"Target audience: {req.target_audience}" if req.target_audience else ""

    format_instructions = {
        "ugc_ad": "Hook → Problem → Solution (product) → Social proof → CTA",
        "testimonial": "Hook → Personal story → Discovery → Results → Recommendation",
        "tutorial": "Hook → What you'll learn → Step-by-step demo → Result → CTA",
        "problem_solution": "Hook → Agitate the problem → Introduce solution → Show it working → CTA",
    }

    structure = format_instructions.get(req.format, format_instructions["ugc_ad"])

    prompt = f"""You are a viral {req.platform.upper()} UGC ad scriptwriter. Write a complete script for a {req.duration_sec}-second video.

Product: {req.product_name}
Description: {req.product_description}
{audience_line}
Format: {req.format.replace("_", " ").title()}
Structure: {structure}

Rules:
- Write exactly what the person says out loud (spoken word, conversational)
- Include [VISUAL] notes in brackets for what should be shown on screen
- Keep it under {req.duration_sec} seconds when spoken at normal pace (~130 words/min)
- Hook must be the first line, under 12 words, must stop the scroll
- End with a clear CTA (follow, link in bio, comment, etc.)
- Sound like a real person, not an ad
- Use line breaks between sections

Return ONLY a JSON object with this exact structure:
{{
  "hook": "the opening line",
  "sections": [
    {{"label": "Hook", "lines": ["line 1", "[VISUAL: description]"]}},
    {{"label": "Problem", "lines": ["line 1", "line 2"]}},
    {{"label": "Solution", "lines": ["line 1", "[VISUAL: description]", "line 2"]}},
    {{"label": "CTA", "lines": ["line 1"]}}
  ],
  "full_script": "the complete script as one block of text",
  "estimated_seconds": 30
}}"""

    response = await client.aio.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
    )

    text = response.text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    import json
    try:
        script = json.loads(text)
    except Exception:
        raise HTTPException(500, f"Failed to parse script response: {text}")

    return script
