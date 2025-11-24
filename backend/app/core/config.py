# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongo_uri: str
    mongo_db: str
    google_drive_service_account_json: str | None = None
    google_drive_root_folder_id: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
