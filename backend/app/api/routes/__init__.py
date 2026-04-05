from .auth import router as auth_router
from .owner import router as owner_router
from .courier import router as courier_router
from .customer import router as customer_router
from .moderator import router as moderator_router
from .websocket import router as ws_router

__all__ = [
    "auth_router",
    "owner_router",
    "courier_router",
    "customer_router",
    "moderator_router",
    "ws_router",
]
