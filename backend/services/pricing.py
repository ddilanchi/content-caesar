"""Cost calculation for all AI generation tools.

Prices as of March 2026 (update here when pricing changes).
"""

# Nano Banana 2 (gemini-3.1-flash-image-preview) — per image by resolution
NANO_BANANA_2 = {
    "512":  0.045,   # 512px
    "1k":   0.067,   # 1K (default)
    "2k":   0.101,   # 2K
    "4k":   0.151,   # 4K
}

# Kling 3.0 via Fal.ai — per second of video
KLING_V3 = {
    "standard": 0.168,   # $/sec
    "pro":      0.392,   # $/sec
}

# ElevenLabs TTS — per 1000 characters
ELEVENLABS = {
    "per_1k_chars": 0.30,
}

# Gemini Flash (SOTA check) — per 1M tokens, effectively negligible per call
GEMINI_FLASH_PER_CALL = 0.001  # estimate ~$0.001 per SOTA check


def cost_image(resolution: str = "1k") -> dict:
    """Cost for a single Nano Banana 2 image."""
    price = NANO_BANANA_2.get(resolution, NANO_BANANA_2["1k"])
    return {
        "total": round(price, 4),
        "breakdown": {"nano_banana_2": price, "resolution": resolution},
    }


def cost_slideshow(num_images: int = 5, resolution: str = "1k") -> dict:
    """Cost for a slideshow (N images stitched into video)."""
    price_per = NANO_BANANA_2.get(resolution, NANO_BANANA_2["1k"])
    total = price_per * num_images
    return {
        "total": round(total, 4),
        "breakdown": {
            "nano_banana_2": round(total, 4),
            "images": num_images,
            "price_per_image": price_per,
        },
    }


def cost_video(duration_sec: int, tier: str = "standard") -> dict:
    """Cost for a Kling 3.0 video generation."""
    rate = KLING_V3.get(tier, KLING_V3["standard"])
    total = rate * duration_sec
    return {
        "total": round(total, 4),
        "breakdown": {
            "kling_v3": round(total, 4),
            "duration_sec": duration_sec,
            "rate_per_sec": rate,
            "tier": tier,
        },
    }


def cost_tts(char_count: int) -> dict:
    """Cost for ElevenLabs TTS."""
    total = (char_count / 1000) * ELEVENLABS["per_1k_chars"]
    return {
        "total": round(total, 4),
        "breakdown": {
            "elevenlabs": round(total, 4),
            "characters": char_count,
        },
    }
