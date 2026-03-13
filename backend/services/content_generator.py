"""Content generation orchestrator.

Routes generation requests to the appropriate AI tools (video, image, slideshow).
This is the core pipeline that ties together image gen, video gen, TTS, captions, etc.
"""

import os
import json
import httpx
from datetime import datetime, timezone
from services.pricing import cost_image, cost_slideshow, cost_video

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


async def generate_content(request, character=None, tools: dict | None = None) -> dict:
    """Main generation pipeline.

    Steps (varies by content_type):
    1. Build enhanced prompt using character details + user prompt
    2. Generate base images/video via configured tool
    3. If video with character: generate voice -> lip sync
    4. Add captions if requested
    5. Add music track if specified
    6. Apply video artifacts if casual style
    7. Export final file
    """
    tools = tools or {}
    content_type = request.content_type
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_filename = f"{content_type}_{timestamp}"

    # Build the full prompt with character context
    full_prompt = _build_prompt(request.prompt, character, request.style)

    if content_type == "image":
        result = await _generate_image(full_prompt, request, tools)
        output_filename += ".png"
        if result.get("status") == "generated":
            c = cost_image()
            result["cost_usd"] = c["total"]
            result["cost_breakdown"] = c["breakdown"]
    elif content_type == "slideshow":
        result = await _generate_slideshow(full_prompt, request, tools)
        output_filename += ".mp4"
        if result.get("status") == "generated":
            c = cost_slideshow(num_images=5)
            result["cost_usd"] = c["total"]
            result["cost_breakdown"] = c["breakdown"]
    elif content_type == "video":
        result = await _generate_video(full_prompt, request, character, tools)
        output_filename += ".mp4"
        if result.get("status") == "generated":
            duration = getattr(request, "duration", 5) or 5
            c = cost_video(duration_sec=duration)
            result["cost_usd"] = c["total"]
            result["cost_breakdown"] = c["breakdown"]
    else:
        raise ValueError(f"Unknown content type: {content_type}")

    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # Save binary output to file if present
    for key in ("image_bytes", "video_bytes"):
        val = result.get(key)
        if val:
            with open(output_path, "wb") as f:
                f.write(val)
            result.pop(key)
            result["file_path"] = output_path
            break

    manifest = {
        "prompt": full_prompt,
        "content_type": content_type,
        "character": character.name if character else None,
        "config": request.model_dump(),
        "status": result.get("status", "unknown"),
        "output_path": output_path,
    }
    manifest_path = os.path.join(OUTPUT_DIR, f"{output_filename}.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2, default=str)

    return {"file_path": output_path, "manifest_path": manifest_path, **result}


def _build_prompt(user_prompt: str, character=None, style: str | None = None) -> str:
    """Combine user prompt with character details for consistent generation."""
    parts = []

    if character:
        parts.append(f"Character: {character.name}")
        if character.appearance:
            parts.append(f"Appearance: {character.appearance}")
        if character.style:
            parts.append(f"Style: {character.style}")
        if character.char_meta:
            meta = character.char_meta
            for key in ["age", "ethnicity", "personality", "setting"]:
                if key in meta:
                    parts.append(f"{key.title()}: {meta[key]}")

    if style:
        style_map = {
            "casual_phone": "Shot on iPhone, casual handheld footage, slightly shaky, natural lighting, authentic UGC feel",
            "professional": "Professional studio lighting, clean composition, high production value",
            "cinematic": "Cinematic color grading, wide angle, dramatic lighting, film grain",
            "aesthetic": "Soft pastel tones, dreamy aesthetic, gentle transitions",
        }
        parts.append(f"Visual style: {style_map.get(style, style)}")

    parts.append(f"Content: {user_prompt}")
    return "\n".join(parts)


async def _generate_image(prompt: str, request, tools: dict) -> dict:
    """Generate a single image using Nano Banana 2 (gemini-3.1-flash-image-preview)."""
    api_key = tools.get("gemini_api_key")
    if not api_key:
        return {"type": "image", "status": "no_api_key", "prompt_used": prompt}

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = await client.aio.models.generate_content(
        model="gemini-3.1-flash-image-preview",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"]
        ),
    )

    for part in response.candidates[0].content.parts:
        if part.inline_data is not None:
            return {"type": "image", "status": "generated", "image_bytes": part.inline_data.data, "prompt_used": prompt}

    return {"type": "image", "status": "no_image_returned", "prompt_used": prompt}


async def _generate_slideshow(prompt: str, request, tools: dict) -> dict:
    """Generate a slideshow: multiple images via Nano Banana 2, stitched into a video."""
    import asyncio
    from moviepy.editor import ImageSequenceClip
    import tempfile, numpy as np
    from PIL import Image
    import io

    NUM_SLIDES = 5
    SLIDE_DURATION = 3  # seconds per image

    # Generate all images concurrently
    slide_prompts = [f"{prompt} (slide {i+1} of {NUM_SLIDES}, varied angle/composition)" for i in range(NUM_SLIDES)]
    results = await asyncio.gather(*[_generate_image(p, request, tools) for p in slide_prompts])

    frames = []
    for r in results:
        if r.get("status") != "generated" or not r.get("image_bytes"):
            continue
        img = Image.open(io.BytesIO(r["image_bytes"])).convert("RGB")
        # Resize to 1080x1920 (9:16)
        img = img.resize((1080, 1920), Image.LANCZOS)
        frames.append(np.array(img))

    if not frames:
        return {"type": "slideshow", "status": "no_images_generated", "prompt_used": prompt}

    # Write to temp files for moviepy
    tmp_paths = []
    for i, frame in enumerate(frames):
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        Image.fromarray(frame).save(tmp.name)
        tmp_paths.append(tmp.name)
        # Hold each frame for SLIDE_DURATION seconds (repeat at 1fps equivalent)
        for _ in range(SLIDE_DURATION - 1):
            tmp_paths.append(tmp.name)

    clip = ImageSequenceClip(tmp_paths, fps=1)
    video_bytes_io = io.BytesIO()
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp_vid:
        clip.write_videofile(tmp_vid.name, fps=1, logger=None, audio=False)
        with open(tmp_vid.name, "rb") as f:
            video_bytes = f.read()
        os.unlink(tmp_vid.name)

    for p in set(tmp_paths):
        try: os.unlink(p)
        except: pass

    return {"type": "slideshow", "status": "generated", "video_bytes": video_bytes, "prompt_used": prompt}


async def _generate_video(prompt: str, request, character=None, tools: dict = None) -> dict:
    """Generate a video using Kling 3.0 via Fal.ai.

    Uses text-to-video for standard generation.
    Image-to-video (character reference frame) to be added in Phase 2.
    """
    tools = tools or {}
    api_key = tools.get("fal_api_key")
    if not api_key:
        return {"type": "video", "status": "no_api_key", "prompt_used": prompt}

    import fal_client

    os.environ["FAL_KEY"] = api_key

    # Map aspect_ratio to Kling's accepted values
    aspect_ratio = getattr(request, "aspect_ratio", "9:16") or "9:16"
    aspect_map = {"9:16": "9:16", "16:9": "16:9", "1:1": "1:1"}
    kling_ratio = aspect_map.get(aspect_ratio, "9:16")

    # Duration: Kling accepts "5" or "10"
    duration_sec = getattr(request, "duration", 5) or 5
    kling_duration = "10" if duration_sec >= 8 else "5"

    try:
        result = await fal_client.run_async(
            "fal-ai/kling-video/v3/standard/text-to-video",
            arguments={
                "prompt": prompt,
                "duration": kling_duration,
                "aspect_ratio": kling_ratio,
                "cfg_scale": 0.5,
                "generate_audio": False,
            },
        )
    except Exception as e:
        return {"type": "video", "status": "error", "error": str(e), "prompt_used": prompt}

    video_url = result.get("video", {}).get("url")
    if not video_url:
        return {"type": "video", "status": "no_video_returned", "prompt_used": prompt}

    # Download video bytes
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(video_url)
        resp.raise_for_status()
        video_bytes = resp.content

    return {"type": "video", "status": "generated", "video_bytes": video_bytes, "prompt_used": prompt}
