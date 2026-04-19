from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers_auth import router as auth_router
from app.api.routers_users import router as users_router
from app.core.exceptions import register_exception_handlers
from app.api.routers_rental_plans import router as rental_plans_router
from app.api.routers_category import router as category_router
from app.api.routers_assets import router as assets_router
from app.api.routers_booking import router as booking_router
from app.api.routers_allocation import router as allocation_router
from app.api.routers_return import router as return_router
from app.api.routers_payment import router as payment_router
from app.db.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    await seed()
    yield

app = FastAPI(
    title="Asset-Tracking-System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception Handlers
register_exception_handlers(app)

# Routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rental_plans_router)
app.include_router(assets_router)
app.include_router(category_router)
app.include_router(booking_router)
app.include_router(allocation_router)
app.include_router(return_router)
app.include_router(payment_router)

@app.get("/health")
async def health():
    return {"status": "ok"}