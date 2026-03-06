"""Content generation orchestrator.

Routes generation requests to the appropriate AI tools (video, image, slideshow).
This is the core pipeline that ties together image gen, video gen, TTS, captions, etc.
"""

import os
import json
from datetime import datetime, timezone

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "data", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


async def generate_content(request, character=None) -> dict:
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
    content_type = request.content_type
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    output_filename = f"{content_type}_{timestamp}"

    # Build the full prompt with character context
    full_prompt = _build_prompt(request.prompt, character, request.style)

    if content_type == "image":
        result = await _generate_image(full_prompt, request)
        output_filename += ".png"
    elif content_type == "slideshow":
        result = await _generate_slideshow(full_prompt, request)
        output_filename += ".mp4"
    elif content_type == "video":
        result = await _generate_video(full_prompt, request, character)
        output_filename += ".mp4"
    else:
        raise ValueError(f"Unknown content type: {content_type}")

    output_path = os.path.join(OUTPUT_DIR, output_filename)

    # For now, write a placeholder manifest until real tools are connected
    manifest = {
        "prompt": full_prompt,
        "content_type": content_type,
        "character": character.name if character else None,
        "config": request.model_dump(),
        "status": "pending_tool_connection",
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
        if character.metadata:
            meta = character.metadata
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


async def _generate_image(prompt: str, request) -> dict:
    """Generate a single image. Will integrate with Flux/Midjourney/etc."""
    # TODO: Connect to actual image generation API
    return {"type": "image", "status": "placeholder", "prompt_used": prompt}


async def _generate_slideshow(prompt: str, request) -> dict:
    """Generate a slideshow (multiple images + transitions + music).

    Pipeline:
    1. Generate N images from prompt variations
    2. Compose into video with transitions
    3. Add music track
    4. Add captions if text overlay needed
    """
    # TODO: Connect to actual tools
    return {"type": "slideshow", "status": "placeholder", "prompt_used": prompt}


async def _generate_video(prompt: str, request, character=None) -> dict:
    """Generate a video.

    Pipeline:
    1. Generate base video clip OR image-to-video
    2. If character has voice: TTS -> lip sync
    3. Add captions
    4. Add music
    5. Apply artifacts for UGC feel
    """
    # TODO: Connect to actual video generation API
    return {"type": "video", "status": "placeholder", "prompt_used": prompt}
