#store endpoint / route of API version 1
from .detect import router as detect_router

routers = [
    (detect_router, 'detect', "AI_Detect")
]
