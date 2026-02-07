from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # MongoDB
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "accountability_ai"

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/integrations/google/callback"

    # Todoist (optional — uses API token auth)
    todoist_client_id: str = ""
    todoist_client_secret: str = ""

    # Expo Push (optional)
    expo_access_token: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
