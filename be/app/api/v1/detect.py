import base64
from fastapi import APIRouter, File, UploadFile

from app.schemas.history import HistoryCreate
from app.db.supabase_client import supabase


router = APIRouter()

@router.post('/analyze-text')
def analyze_text(data: HistoryCreate):
    result = {"toxicity": 0.72, "label": "toxic"} 

    supabase.table('history').insert({
        "input_type": "text",
        "input_value": data.input_value,
        "result": result
    }).execute()

    return {"success": True, "data": result}

@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    content = await file.read()
    img_base64 = base64.b64encode(content).decode("utf-8")

    result = {"violence": 0.1, "nudity": 0.8, "label": "unsafe"}

    supabase.table("history").insert({
        "input_type": "image",
        "input_value": img_base64[:100] + "...",  
        "result": result
    }).execute()

    return {"success": True, "data": result}
    

@router.get("/history")
def get_history():
    data = supabase.table("history").select("*").order("id", desc=True).limit(20).execute()
    return {"success": True, "data": data.data}

@router.post("/history")
def add_history(history: HistoryCreate):
    supabase.table("history").insert(history.dict()).execute()
    return {"success": True, "message": "History saved"}