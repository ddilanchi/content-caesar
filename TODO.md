# Content Caesar - TODO

## API Keys Needed
- [x] Gemini API key — in .env (SOTA checker + Nano Banana 2 image gen)
- [x] Fal.ai API key — in .env as FAL_API_KEY (Kling 3.0 video gen, $0.168/s standard)
- [ ] Fish Audio or ElevenLabs key (voice/TTS)
- [ ] Sync.so key (lip sync) — or Hedra for free tier
- [ ] Ayrshare key ($30-200/mo) — unified social posting API for TikTok/YouTube/IG/Pinterest

## Decision Points
- [x] Image gen: Nano Banana 2 (Google, gemini-3.1-flash-image-preview) — same Gemini key
- [x] Video gen: Kling 3.0 via Fal.ai — best quality/cost for UGC
- [ ] TTS provider: Fish Audio S1 (cheaper, #1 ranked) vs ElevenLabs (emotional depth)?
- [ ] Social posting: Ayrshare (unified, fast to integrate) vs direct APIs (more control, 6-10 weeks)?

---

## Phase 1 — Core Pipeline (Current)
- [x] Project scaffolded (FastAPI + React)
- [x] Database models (workspaces, characters, posts, social accounts, tool configs)
- [x] CRUD APIs for all entities
- [x] Dashboard with SOTA checker
- [x] Character management UI (appearance, style, metadata)
- [x] Content generation form (type, style, captions, music, artifacts)
- [x] Post manager with status filters
- [x] Settings page (workspaces, API keys, social accounts)
- [x] Scheduler service (APScheduler, checks every minute)
- [x] Local file export fallback for social posting
- [x] Wire Gemini API key into SOTA checker (auto-seeded from .env on startup)
- [x] Wire up image generation (Nano Banana 2 / gemini-3.1-flash-image-preview)
- [x] Wire up video generation (Kling 3.0 via Fal.ai — needs FAL_API_KEY in .env)
- [ ] Wire up TTS (Fish Audio or ElevenLabs API)

## Phase 2 — Character Consistency
- [ ] Reference image upload + storage per character
- [ ] LoRA training pipeline (generate 20-30 refs with Flux -> train LoRA)
- [ ] LoRA model storage + selection in generation form
- [ ] Character-to-video pipeline (LoRA image -> video gen reference frame)
- [ ] Face consistency validation (compare generated vs reference)

## Phase 3 — Video Post-Processing
- [ ] Lip sync integration (Sync.so or Hedra)
- [ ] Caption generation (Whisper transcription -> word-by-word animated overlay)
- [ ] Music track mixing (volume ducking under speech)
- [ ] Phone video artifacts (slight shake, lens flare, compression, auto-exposure shifts)
- [ ] Aspect ratio auto-cropping (9:16, 16:9, 1:1, 2:3)
- [ ] Thumbnail auto-generation

## Phase 4 — Social Media Integration
- [ ] Ayrshare integration (unified posting to all platforms)
- [ ] OR direct integrations:
  - [ ] YouTube Data API v3 (upload, schedule, private/draft)
  - [ ] TikTok Content Posting API (apply for audit)
  - [ ] Instagram Graph API (Reels, carousels, scheduling)
  - [ ] Pinterest API v5 (pins, scheduled pins)
- [ ] OAuth flow UI for connecting accounts
- [ ] Post preview per platform (aspect ratio, caption length limits)
- [ ] Hashtag suggestions (Gemini-powered per platform)

## Phase 5 — Content Intelligence
- [ ] Analytics dashboard (views, engagement per post/platform/character)
- [ ] A/B testing support (same content, different captions/music/thumbnails)
- [ ] Trending audio/format detection (Gemini scrapes what's viral)
- [ ] Auto-caption optimization (Gemini rewrites captions for each platform's style)
- [ ] Content calendar view (visual schedule across all platforms)
- [ ] Batch generation (queue 10+ videos overnight)

## Phase 6 — Advanced
- [ ] Template system (save successful prompts + settings as reusable templates)
- [ ] Multi-character scenes (two AI influencers interacting)
- [ ] Script writer (Gemini generates scripts from topic/product brief)
- [ ] Slideshow builder (Pinterest-optimized photo carousels with transitions)
- [ ] Voice cloning per character (clone a specific voice, lock to character)
- [ ] Webhook notifications (Slack/Discord alerts when posts go live or fail)
- [ ] Multi-user support (team members with different permissions per workspace)
- [ ] Content approval workflow (draft -> review -> approve -> schedule)
