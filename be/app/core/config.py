#config system like DB URL, secret key, CORS, token expiry
import os
from dotenv import load_dotenv

load_dotenv()

class Setting:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY")

setting = Setting()
