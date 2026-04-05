from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_serializer


def enum_to_str(value) -> str:
    """Convert enum (IntEnum or regular) to its name string"""
    if hasattr(value, 'name'):
        return value.name
    return str(value)


# ============ AUTH ============
class RegisterRequest(BaseModel):
    email: str
    password: str
    phone: str
    first_name: str
    last_name: Optional[str] = None
    role: str = "customer"  # customer, courier, company_owner


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    phone: str
    first_name: str
    last_name: Optional[str]
    role: str
    is_blocked: bool

    class Config:
        from_attributes = True


# ============ COMPANY ============
class CompanyCreate(BaseModel):
    name: str
    company_type: str = "restaurant"
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = "Ростов-на-Дону"
    latitude: str
    longitude: str
    phone: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    slug: Optional[str]
    company_type: str
    description: Optional[str]
    logo_url: Optional[str]
    address: Optional[str]
    city: Optional[str]
    phone: Optional[str]
    moderation_status: str
    is_blocked: bool

    class Config:
        from_attributes = True


# ============ MENU ITEM ============
class MenuItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: str
    old_price: Optional[str] = None
    category: str = "other"
    image_url: Optional[str] = None


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    old_price: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None


class MenuItemResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    price: str
    old_price: Optional[str]
    category: str
    image_url: Optional[str]
    is_available: bool
    moderation_status: str

    class Config:
        from_attributes = True


# ============ DELIVERY ZONE ============
class DeliveryZoneCreate(BaseModel):
    name: str
    center_latitude: str
    center_longitude: str
    radius_km: str


class DeliveryZoneResponse(BaseModel):
    id: UUID
    name: str
    center_latitude: str
    center_longitude: str
    radius_km: str

    class Config:
        from_attributes = True


# ============ DELIVERY ADDRESS ============
class DeliveryAddressCreate(BaseModel):
    label: Optional[str] = None
    address: str
    latitude: str
    longitude: str
    floor: Optional[str] = None
    apartment: Optional[str] = None
    comment: Optional[str] = None


class DeliveryAddressResponse(BaseModel):
    id: UUID
    label: Optional[str]
    address: str
    floor: Optional[str]
    apartment: Optional[str]

    class Config:
        from_attributes = True


# ============ ORDER ============
class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = Field(ge=1, default=1)


class OrderCreate(BaseModel):
    company_id: UUID
    delivery_address_id: UUID
    items: list[OrderItemCreate]
    promo_code: Optional[str] = None
    comment: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    menu_item_id: UUID
    quantity: str
    price_at_order: str

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: UUID
    company_id: UUID
    status: str
    total_amount: str
    delivery_fee: str
    distance_km: Optional[str]
    eta_minutes: Optional[str]
    created_at: datetime
    courier_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class OrderFullResponse(OrderResponse):
    items: list[OrderItemResponse] = []
    delivery_address: Optional[DeliveryAddressResponse] = None
    customer_phone: Optional[str] = None
    customer_details: Optional[str] = None

    class Config:
        from_attributes = True


# ============ COURIER SESSION ============
class CourierSessionResponse(BaseModel):
    id: UUID
    status: str
    started_at: datetime
    ended_at: Optional[datetime]

    class Config:
        from_attributes = True


# ============ COURIER ORDER VIEW (до принятия) ============
class CourierOrderPreview(BaseModel):
    id: UUID
    company_name: str
    company_address: str
    total_amount: str
    distance_km: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============ MODERATOR ============
class ModerationAction(BaseModel):
    action: str  # approve, reject, block, unblock


class ModerationStats(BaseModel):
    companies_pending: int
    menu_items_pending: int
    couriers_pending: int
    total_orders: int
    active_couriers: int


# ============ PROMO CODE ============
class PromoCodeCreate(BaseModel):
    code: str
    discount_percent: str
    min_order_amount: Optional[str] = None
    max_uses: Optional[str] = None
    expires_at: Optional[str] = None
    company_id: Optional[UUID] = None


class PromoCodeResponse(BaseModel):
    id: UUID
    code: str
    discount_percent: str
    min_order_amount: Optional[str]
    max_uses: Optional[str]
    used_count: str
    expires_at: Optional[str]
    is_active: bool
    company_id: Optional[UUID]

    class Config:
        from_attributes = True


class PromoCodeApply(BaseModel):
    code: str
    company_id: UUID
    order_amount: str


class PromoCodeValidate(BaseModel):
    valid: bool
    discount_percent: Optional[str] = None
    final_amount: Optional[str] = None
    error: Optional[str] = None
