from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers_auth import router as auth_router
from app.api.routers_users import router as users_router
from app.api.routers_department import router as departments_router
from app.core.exceptions import register_exception_handlers

app = FastAPI(
    title="Asset-Tracking-System",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
register_exception_handlers(app)

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(departments_router)

@app.get("/health")
async def health():
    return {"status": "ok"}