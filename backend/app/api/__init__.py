from fastapi import APIRouter
from .routes import auth_router, owner_router, courier_router, customer_router, moderator_router, ws_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(owner_router)
api_router.include_router(courier_router)
api_router.include_router(customer_router)
api_router.include_router(moderator_router)
api_router.include_router(ws_router)
