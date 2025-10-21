from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import routers as v1_routers


app = FastAPI(
    title="AI Detection API",
    version="1.0",
    description="API version 1 for text and image analysis",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router, prefix, _ in v1_routers:
    app.include_router(router, prefix=f"/api/v1/{prefix}", tags=[prefix])

# --- Root endpoint ---
@app.get("/api/v1")
def root():
    return {"message": "Hello"}