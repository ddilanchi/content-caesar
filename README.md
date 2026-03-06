# Content Caesar

AI-powered UGC video generation dashboard. Generate and post content to TikTok, YouTube, Instagram, Pinterest from a single interface.

## Features

- **Workspaces** - Separate projects (Pareto, Engineous, etc.) with their own characters, accounts, and content
- **AI Characters** - Create persistent AI influencers with consistent appearance, style, and voice
- **Content Generation** - Videos, slideshows, and images with configurable style (casual UGC, cinematic, etc.)
- **SOTA Check** - On-demand Gemini query to compare current best AI generation tools
- **Captions** - Auto-generated word-by-word animated captions (toggle per post)
- **Music** - Add background tracks to generated content
- **Scheduling** - Schedule posts with automatic publishing
- **Draft Mode** - Post as drafts for manual editing on each platform
- **Multi-Platform** - TikTok, YouTube, Instagram, Pinterest (with local file export fallback)

## File Structure

```
CONTENT CAESAR/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Environment config
│   ├── requirements.txt
│   ├── api/
│   │   ├── workspaces.py        # Workspace CRUD
│   │   ├── characters.py        # Character management
│   │   ├── posts.py             # Post CRUD + filtering
│   │   ├── tools.py             # AI tool config + SOTA check
│   │   ├── generation.py        # Content generation endpoint
│   │   └── social.py            # Social account management + posting
│   ├── models/
│   │   ├── database.py          # SQLite async setup
│   │   └── schemas.py           # SQLAlchemy models
│   └── services/
│       ├── sota_checker.py      # Gemini SOTA comparison query
│       ├── content_generator.py # Generation pipeline orchestrator
│       ├── social_poster.py     # Platform posting + local export fallback
│       └── scheduler.py         # APScheduler for timed posts
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx              # Routes
│       ├── main.jsx             # Entry point
│       ├── components/
│       │   ├── Layout.jsx       # Sidebar + nav
│       │   └── WorkspaceSelector.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx    # Stats + SOTA check
│       │   ├── Characters.jsx   # Character CRUD
│       │   ├── Generate.jsx     # Content generation form
│       │   ├── Posts.jsx        # Post list + publish
│       │   └── Settings.jsx     # Workspaces, API keys, social accounts
│       ├── styles/index.css     # Dark theme
│       └── utils/api.js         # Axios instance
├── data/                        # SQLite DB + generated outputs (gitignored)
├── characters/                  # Reference images for characters
└── templates/                   # Reusable content templates
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Dashboard at http://localhost:3000, API at http://localhost:8000/docs

## Setup

1. Start backend and frontend
2. Go to Settings, create a workspace (e.g., "Pareto UGC")
3. Add your Gemini API key as a tool (name: `gemini`, category: `llm`)
4. Run SOTA Check from Dashboard to see current best tools
5. Add API keys for your chosen video/image/voice tools
6. Create characters with detailed appearance descriptions
7. Generate content from the Generate page

## Current State

- **Status:** Scaffolded, UI functional, generation pipeline stubbed
- **Last Updated:** 2026-03-06

## TODO

- [ ] Connect actual AI generation APIs (video, image, voice)
- [ ] Implement character consistency (face reference / LoRA)
- [ ] TikTok Content Posting API integration
- [ ] YouTube Data API v3 upload
- [ ] Instagram Graph API integration
- [ ] Pinterest API v5 integration
- [ ] Caption generation (whisper + animated overlay)
- [ ] Music library integration
- [ ] Video artifact post-processing (phone cam feel)
- [ ] Lip sync integration
- [ ] Batch generation queue
