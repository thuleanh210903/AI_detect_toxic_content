#connect supabase

from supabase import create_client
from app.core.config import setting


supabase = create_client(setting.SUPABASE_URL, setting.SUPABASE_KEY)
