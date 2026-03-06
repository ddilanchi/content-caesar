"""Central configuration. Reads from environment or .env file."""

import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
