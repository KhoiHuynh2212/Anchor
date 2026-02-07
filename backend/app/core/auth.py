from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client
from app.config import settings

security = HTTPBearer()

_supabase = None


def get_supabase():
    global _supabase
    if _supabase is None:
        _supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _supabase


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """Verify Supabase JWT and return user ID."""
    try:
        supabase = get_supabase()
        user = supabase.auth.get_user(credentials.credentials)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
