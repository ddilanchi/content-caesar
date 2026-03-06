"""SOTA checker — queries Gemini on startup to report current best AI content tools."""

import httpx

SOTA_PROMPT = """You are an AI content creation tools analyst. Provide a current comparison of the BEST tools available for AI-generated UGC (user-generated content) creation. Focus on tools that have APIs or can be automated.

For each category, list the top 3 tools with:
- Name and pricing
- API availability (yes/no, and ease of integration)
- Quality rating (1-10)
- Best use case
- Key limitations

Categories:
1. **AI Video Generation** (for short-form vertical video, TikTok/Reels style)
2. **AI Image Generation** (for realistic people/influencers with character consistency)
3. **AI Voice/TTS** (for natural voiceovers)
4. **AI Lip Sync** (for making generated characters speak)
5. **AI Music Generation** (for background tracks)
6. **Caption/Subtitle Generation** (for animated captions)

Also note:
- Any NEW tools that launched recently that people should know about
- Which combinations of tools work best together
- Any tools that are overhyped vs actually good

Format as a clean, readable report with clear rankings."""


async def check_sota(api_key: str | None = None) -> str:
    """Query Gemini for current SOTA AI content generation tools."""
    if not api_key:
        return "No Gemini API key configured. Add it in Tools settings."

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}",
            json={
                "contents": [{"parts": [{"text": SOTA_PROMPT}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096},
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
