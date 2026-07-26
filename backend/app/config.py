from pydantic import field_validator
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
    elevenlabs_tts_model: str = "eleven_turbo_v2_5"
    elevenlabs_tts_stability: float = 0.5
    elevenlabs_tts_similarity: float = 0.75
    elevenlabs_tts_style: float = 0.3
    elevenlabs_stt_model: str = "scribe_v1"

    @field_validator("elevenlabs_tts_stability", "elevenlabs_tts_similarity", "elevenlabs_tts_style")
    @classmethod
    def validate_voice_params(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Voice parameter must be between 0.0 and 1.0, got {v}")
        return v

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
