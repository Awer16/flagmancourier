import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum as SAEnum, Boolean, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()


class UserRole(enum.Enum):
    CUSTOMER = "customer"
    COURIER = "courier"
    COMPANY_OWNER = "company_owner"
    ENTERPRISE = "enterprise"  # Подтверждает заказы, видит активные
    MODERATOR = "moderator"


class CompanyType(enum.Enum):
    RESTAURANT = "restaurant"
    STORE = "store"
    CAFE = "cafe"
    GROCERY = "grocery"
    BAKERY = "bakery"
    OTHER = "other"


class OrderStatus(enum.Enum):
    PENDING = "pending"                    # Создан, ожидает подтверждения рестораном
    CONFIRMED = "confirmed"                # Ресторан принял заказ
    READY_FOR_PICKUP = "ready_for_pickup"  # Ресторан отдал курьеру
    ACCEPTED = "accepted"                  # Курьер принял
    PICKED_UP = "picked_up"                # Курьер забрал из ресторана
    IN_DELIVERY = "in_delivery"            # В пути к клиенту
    DELIVERED = "delivered"                # Вручен клиенту
    CANCELLED = "cancelled"
    REJECTED = "rejected"


class CourierSessionStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MenuItemCategory(enum.Enum):
    MAIN = "main"
    DRINKS = "drinks"
    DESSERTS = "desserts"
    SNACKS = "snacks"
    SALADS = "salads"
    SOUPS = "soups"
    OTHER = "other"


class ModerationStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class BaseModel(Base):
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.utcnow)


def _enum_values(enum_cls):
    return [e.value for e in enum_cls]


class User(BaseModel):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    role = Column(SAEnum(UserRole, values_callable=_enum_values), nullable=False, default=UserRole.CUSTOMER)
    moderation_status = Column(SAEnum(ModerationStatus, values_callable=_enum_values), nullable=False, default=ModerationStatus.PENDING)
    refresh_token = Column(String(500), nullable=True)
    refresh_token_expiry = Column(DateTime, nullable=True)
    is_blocked = Column(Boolean, nullable=False, default=False)
    balance = Column(String(20), nullable=False, default="0.00")


class Company(BaseModel):
    __tablename__ = "companies"

    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=True, index=True)
    company_type = Column(SAEnum(CompanyType, values_callable=_enum_values), nullable=False, default=CompanyType.RESTAURANT)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    address = Column(String(300), nullable=True)
    city = Column(String(100), nullable=True, default="Ростов-на-Дону")
    latitude = Column(String(50), nullable=False)
    longitude = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=True)
    owner_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    moderation_status = Column(SAEnum(ModerationStatus, values_callable=_enum_values), nullable=False, default=ModerationStatus.APPROVED)
    is_blocked = Column(Boolean, nullable=False, default=False)


class MenuItem(BaseModel):
    __tablename__ = "menu_items"

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(String(20), nullable=False)
    old_price = Column(String(20), nullable=True)  # Цена до скидки
    category = Column(SAEnum(MenuItemCategory, values_callable=_enum_values), nullable=False, default=MenuItemCategory.OTHER)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, nullable=False, default=True)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    moderation_status = Column(SAEnum(ModerationStatus, values_callable=_enum_values), nullable=False, default=ModerationStatus.APPROVED)


class DeliveryZone(BaseModel):
    __tablename__ = "delivery_zones"

    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    center_latitude = Column(String(50), nullable=False)
    center_longitude = Column(String(50), nullable=False)
    radius_km = Column(String(20), nullable=False)


class DeliveryAddress(BaseModel):
    __tablename__ = "delivery_addresses"

    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    label = Column(String(100), nullable=True)
    address = Column(String(300), nullable=False)
    latitude = Column(String(50), nullable=False)
    longitude = Column(String(50), nullable=False)
    floor = Column(String(20), nullable=True)
    apartment = Column(String(20), nullable=True)
    comment = Column(Text, nullable=True)


class CourierSession(BaseModel):
    __tablename__ = "courier_sessions"

    courier_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(SAEnum(CourierSessionStatus, values_callable=_enum_values), nullable=False, default=CourierSessionStatus.ACTIVE)
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    city = Column(String(100), nullable=True)  # Город курьера
    district = Column(String(100), nullable=True)  # Район курьера


class PromoCode(BaseModel):
    __tablename__ = "promo_codes"

    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_percent = Column(String(20), nullable=False)
    min_order_amount = Column(String(20), nullable=True)
    max_uses = Column(String(20), nullable=True)
    used_count = Column(String(20), nullable=False, default="0")
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    company_id = Column(UUID(as_uuid=True), nullable=True)


class Order(BaseModel):
    __tablename__ = "orders"

    customer_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    courier_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    delivery_address_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(SAEnum(OrderStatus, values_callable=_enum_values), nullable=False, default=OrderStatus.PENDING)
    total_amount = Column(String(20), nullable=False)
    original_amount = Column(String(20), nullable=True)
    promo_code_id = Column(UUID(as_uuid=True), nullable=True)
    delivery_fee = Column(String(20), nullable=False, default="0")
    distance_km = Column(String(20), nullable=True)
    eta_minutes = Column(String(20), nullable=True)  # Примерное время доставки
    delivery_method = Column(String(50), nullable=True)  # courier, car, bicycle, foot
    courier_earnings = Column(String(20), nullable=True)  # Заработок курьера за заказ
    comment = Column(Text, nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_details = Column(Text, nullable=True)
    # Координаты точки доставки
    delivery_latitude = Column(String(50), nullable=True)
    delivery_longitude = Column(String(50), nullable=True)
    # Город и район для привязки курьеров
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)


class OrderItem(BaseModel):
    __tablename__ = "order_items"

    order_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    menu_item_id = Column(UUID(as_uuid=True), nullable=False)
    quantity = Column(String(20), nullable=False, default="1")
    price_at_order = Column(String(20), nullable=False)
