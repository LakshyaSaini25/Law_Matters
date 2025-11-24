# app/db/mongo.py
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from ..core.config import settings

_client: Optional[AsyncIOMotorClient] = None

def get_client() -> AsyncIOMotorClient:
    """
    Return a global Motor client (created lazily).
    Uses settings.mongo_uri from app/core/config.py
    """
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client

def get_db():
    """
    Return the configured database object.
    """
    return get_client()[settings.mongo_db]
