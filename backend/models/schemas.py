from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class Workspace(Base):
    """A workspace/bin for separating different projects (e.g., Pareto, Engineous)."""
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    characters = relationship("Character", back_populates="workspace")
    posts = relationship("Post", back_populates="workspace")
    social_accounts = relationship("SocialAccount", back_populates="workspace")


class Character(Base):
    """An AI influencer/character with consistent visual identity."""
    __tablename__ = "characters"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)  # General description
    appearance = Column(Text)  # Detailed appearance prompt (hair, face, body type, etc.)
    style = Column(Text)  # Fashion/aesthetic style
    voice_id = Column(String)  # TTS voice identifier
    reference_images = Column(JSON)  # Paths to reference images for consistency
    lora_model = Column(String)  # Path to trained LoRA if applicable
    char_meta = Column(JSON)  # Extra attributes (age, ethnicity, personality, etc.)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="characters")
    posts = relationship("Post", back_populates="character")


class SocialAccount(Base):
    """A connected social media account."""
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    platform = Column(String, nullable=False)  # tiktok, youtube, instagram, pinterest
    account_name = Column(String, nullable=False)
    access_token = Column(String)
    refresh_token = Column(String)
    token_expiry = Column(DateTime)
    extra_config = Column(JSON)  # Platform-specific config
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="social_accounts")


class Post(Base):
    """A piece of content to be posted."""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    character_id = Column(Integer, ForeignKey("characters.id"), nullable=True)
    title = Column(String)
    content_type = Column(String, nullable=False)  # video, slideshow, image
    prompt = Column(Text)  # The generation prompt used
    caption = Column(Text)  # Post caption/description
    hashtags = Column(Text)
    music_track = Column(String)  # Path or identifier for music
    file_path = Column(String)  # Path to generated file
    thumbnail_path = Column(String)
    status = Column(String, default="draft")  # draft, scheduled, posted, failed
    post_as_draft = Column(Boolean, default=False)  # Post as draft on platform
    scheduled_at = Column(DateTime, nullable=True)
    posted_at = Column(DateTime, nullable=True)
    target_platforms = Column(JSON)  # List of platform names to post to
    generation_config = Column(JSON)  # Full config used for generation
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    workspace = relationship("Workspace", back_populates="posts")
    character = relationship("Character", back_populates="posts")


class ToolConfig(Base):
    """Tracks which AI tools are configured and their API keys."""
    __tablename__ = "tool_configs"

    id = Column(Integer, primary_key=True)
    tool_name = Column(String, nullable=False, unique=True)  # e.g., runway, kling, elevenlabs
    category = Column(String)  # video, image, voice, llm
    api_key = Column(String)
    base_url = Column(String)
    is_active = Column(Boolean, default=True)
    config = Column(JSON)
    last_sota_check = Column(DateTime)
