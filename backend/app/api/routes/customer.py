from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import (
    User, Company, MenuItem, DeliveryAddress, Order, OrderItem, DeliveryZone,
    ModerationStatus, OrderStatus, PromoCode
)
from app.core.eta import haversine_km, calculate_eta
from app.core.districts import get_rostov_district
from app.schemas import (
    CompanyResponse, MenuItemResponse,
    DeliveryAddressCreate, DeliveryAddressResponse,
    OrderCreate, OrderFullResponse, OrderResponse,
    PromoCodeValidate
)
from app.api.dependencies import get_current_user as get_current_user_dep
from datetime import datetime

router = APIRouter(prefix="/customer", tags=["Customer"])


# ============ COMPANIES (просмотр) ============
@router.get("/companies", response_model=list[CompanyResponse])
async def get_companies(
    city: str = Query(None, description="Фильтр по городу"),
    db: AsyncSession = Depends(get_db)
):
    query = select(Company).where(
        Company.moderation_status == ModerationStatus.APPROVED,
        Company.is_blocked == False
    )
    if city:
        query = query.where(Company.city == city)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/companies/cities", response_model=list[str])
async def get_available_cities(
    db: AsyncSession = Depends(get_db)
):
    """Получить список городов где есть рестораны"""
    result = await db.execute(
        select(Company.city).where(
            Company.moderation_status == ModerationStatus.APPROVED,
            Company.is_blocked == False,
            Company.city != None
        ).distinct()
    )
    return [row[0] for row in result.all() if row[0]]


@router.get("/companies/by-slug/{slug}", response_model=CompanyResponse)
async def get_company_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get company by slug (for URL routing)"""
    result = await db.execute(
        select(Company).where(
            Company.slug == slug,
            Company.moderation_status == ModerationStatus.APPROVED
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Company).where(
            Company.id == company_id,
            Company.moderation_status == ModerationStatus.APPROVED
        )
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/companies/{company_id}/menu", response_model=list[MenuItemResponse])
async def get_company_menu(company_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MenuItem).where(
            MenuItem.company_id == company_id,
            MenuItem.is_available == True,
            MenuItem.moderation_status == ModerationStatus.APPROVED
        )
    )
    return result.scalars().all()


# ============ DELIVERY ADDRESSES ============
@router.post("/addresses", response_model=DeliveryAddressResponse, status_code=status.HTTP_201_CREATED)
async def add_address(
    data: DeliveryAddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    address = DeliveryAddress(
        user_id=current_user.id,
        label=data.label,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        floor=data.floor,
        apartment=data.apartment,
        comment=data.comment,
    )
    db.add(address)
    await db.flush()
    await db.refresh(address)
    return address


@router.get("/addresses", response_model=list[DeliveryAddressResponse])
async def get_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(DeliveryAddress).where(DeliveryAddress.user_id == current_user.id)
    )
    return result.scalars().all()


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(DeliveryAddress).where(
            DeliveryAddress.id == address_id,
            DeliveryAddress.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    if address:
        await db.delete(address)


# ============ PROMO CODE VALIDATION ============
@router.post("/promo/validate", response_model=PromoCodeValidate)
async def validate_promocode(
    data: PromoCodeValidate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PromoCode).where(PromoCode.code == data.code.upper())
    )
    pc = result.scalar_one_or_none()

    if not pc:
        return PromoCodeValidate(valid=False, error="Промокод не найден")
    if not pc.is_active:
        return PromoCodeValidate(valid=False, error="Промокод не активен")
    if pc.expires_at and datetime.utcnow() > pc.expires_at:
        return PromoCodeValidate(valid=False, error="Промокод истёк")
    if pc.max_uses and int(pc.used_count) >= int(pc.max_uses):
        return PromoCodeValidate(valid=False, error="Промокод использован")
    if pc.min_order_amount and float(data.order_amount) < float(pc.min_order_amount):
        return PromoCodeValidate(valid=False, error=f"Минимальная сумма: {pc.min_order_amount}₽")
    # company_id=None = глобальный промокод, работает везде
    if pc.company_id and str(pc.company_id) != str(data.company_id):
        return PromoCodeValidate(valid=False, error="Промокод не для этого заведения")

    discount = float(data.order_amount) * (int(pc.discount_percent) / 100)
    final = float(data.order_amount) - discount

    return PromoCodeValidate(
        valid=True,
        discount_percent=pc.discount_percent,
        final_amount=str(round(final, 2)),
    )


# ============ ORDERS ============
@router.post("/orders", response_model=OrderFullResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    # Проверить компанию
    company_result = await db.execute(
        select(Company).where(
            Company.id == data.company_id,
            Company.moderation_status == ModerationStatus.APPROVED
        )
    )
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Проверить адрес доставки
    addr_result = await db.execute(
        select(DeliveryAddress).where(
            DeliveryAddress.id == data.delivery_address_id,
            DeliveryAddress.user_id == current_user.id
        )
    )
    address = addr_result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=404, detail="Delivery address not found")

    # Проверить зону доставки и рассчитать расстояние
    distance_km = None
    eta_minutes = None
    zone_result = await db.execute(select(DeliveryZone).where(DeliveryZone.company_id == data.company_id))
    zones = zone_result.scalars().all()
    if zones:
        in_zone = False
        for zone in zones:
            dist = haversine_km(
                float(zone.center_latitude), float(zone.center_longitude),
                float(address.latitude), float(address.longitude)
            )
            if dist <= float(zone.radius_km):
                in_zone = True
                distance_km = round(dist, 2)
                # ETA: 15 мин подготовка + время в пути (курьер ~25 км/ч)
                eta_minutes = 15 + round((dist / 25) * 60)
                # Ограничение: максимум 10 км
                if dist > 10:
                    raise HTTPException(status_code=400, detail="Адрес вне зоны доставки (макс. 10 км)")
                break
        if not in_zone:
            raise HTTPException(status_code=400, detail="Address outside delivery zone")
    else:
        # Если зон нет — считаем расстояние до компании
        distance_km = round(haversine_km(
            float(company.latitude), float(company.longitude),
            float(address.latitude), float(address.longitude)
        ), 2)
        # Ограничение: максимум 10 км
        if distance_km > 10:
            raise HTTPException(status_code=400, detail="Адрес вне зоны доставки (макс. 10 км)")
        eta_minutes = 15 + round((distance_km / 25) * 60)

    # Посчитать сумму
    total = 0
    items_to_create = []
    for item_data in data.items:
        menu_result = await db.execute(
            select(MenuItem).where(
                MenuItem.id == item_data.menu_item_id,
                MenuItem.company_id == data.company_id,
                MenuItem.is_available == True
            )
        )
        menu_item = menu_result.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item_data.menu_item_id} not found")

        item_total = float(menu_item.price) * item_data.quantity
        total += item_total
        items_to_create.append((menu_item, item_data.quantity))

    # Рассчитать доставку (базовая формула)
    delivery_fee = round(50 + len(data.items) * 20, 2)

    # Промокод
    promo_id = None
    original_amount = round(total, 2)
    if data.promo_code:
        pc_result = await db.execute(
            select(PromoCode).where(PromoCode.code == data.promo_code.upper())
        )
        pc = pc_result.scalar_one_or_none()
        if pc and pc.is_active:
            if (not pc.expires_at or datetime.utcnow() <= pc.expires_at) and \
               (not pc.max_uses or int(pc.used_count) < int(pc.max_uses)) and \
               (not pc.min_order_amount or total >= float(pc.min_order_amount)) and \
               (not pc.company_id or pc.company_id == data.company_id):
                promo_id = pc.id
                discount = total * (int(pc.discount_percent) / 100)
                total -= discount
                pc.used_count = str(int(pc.used_count) + 1)

    # Создать заказ
    order = Order(
        customer_id=current_user.id,
        company_id=data.company_id,
        delivery_address_id=data.delivery_address_id,
        total_amount=str(round(total, 2)),
        original_amount=str(original_amount),
        promo_code_id=promo_id,
        delivery_fee=str(delivery_fee),
        distance_km=str(distance_km) if distance_km else None,
        eta_minutes=str(eta_minutes) if eta_minutes else None,
        comment=data.comment,
        customer_phone=current_user.phone,
        customer_details=f"{current_user.first_name} {current_user.last_name or ''}".strip(),
        delivery_latitude=address.latitude,
        delivery_longitude=address.longitude,
        city=company.city,  # Наследуем город от компании
        district=get_rostov_district(float(address.latitude), float(address.longitude)) if company.city == "Ростов-на-Дону" else None,
        status=OrderStatus.PENDING,  # Сначала ожидает подтверждения рестораном
    )
    db.add(order)
    await db.flush()
    await db.refresh(order)

    # Создать позиции заказа
    for menu_item, qty in items_to_create:
        order_item = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=str(qty),
            price_at_order=menu_item.price,
        )
        db.add(order_item)

    await db.flush()
    await db.refresh(order)

    # Send WebSocket notification (non-blocking, ignore errors)
    try:
        from app.api.routes.websocket import notify_new_order
        order_data = {
            "id": str(order.id),
            "company_id": str(company.id),
            "company_name": company.name,
            "company_address": company.address or "",
            "total_amount": order.total_amount,
            "distance_km": order.distance_km,
            "eta_minutes": order.eta_minutes,
            "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
            "created_at": order.created_at.isoformat(),
        }
        await notify_new_order(order_data, str(company.id))
    except Exception as e:
        # WebSocket notification is optional, don't fail the order
        print(f"WebSocket notification failed: {e}")

    return await _build_full_order(db, order)


@router.get("/orders", response_model=list[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(Order.customer_id == current_user.id).order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/orders/{order_id}", response_model=OrderFullResponse)
async def get_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.customer_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return await _build_full_order(db, order)


@router.post("/orders/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.customer_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in [OrderStatus.PENDING, OrderStatus.ACCEPTED]:
        raise HTTPException(status_code=400, detail="Cannot cancel order in this status")

    order.status = OrderStatus.CANCELLED
    await db.flush()
    await db.refresh(order)
    return order


def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Упрощённый расчёт расстояния (Haversine)"""
    from math import radians, cos, sin, sqrt, atan2
    R = 6371  # Radius of Earth in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


async def _build_full_order(db: AsyncSession, order: Order) -> dict:
    from app.schemas import OrderItemResponse, DeliveryAddressResponse

    addr_result = await db.execute(
        select(DeliveryAddress).where(DeliveryAddress.id == order.delivery_address_id)
    )
    addr = addr_result.scalar_one_or_none()

    items_result = await db.execute(select(OrderItem).where(OrderItem.order_id == order.id))
    items = items_result.scalars().all()

    return {
        "id": order.id,
        "company_id": order.company_id,
        "status": order.status.value if hasattr(order.status, 'value') else str(order.status),
        "total_amount": order.total_amount,
        "delivery_fee": order.delivery_fee,
        "distance_km": order.distance_km,
        "eta_minutes": order.eta_minutes,
        "created_at": order.created_at,
        "courier_id": order.courier_id,
        "items": [
            OrderItemResponse(id=i.id, menu_item_id=i.menu_item_id, quantity=i.quantity, price_at_order=i.price_at_order)
            for i in items
        ],
        "delivery_address": DeliveryAddressResponse(
            id=addr.id, label=addr.label, address=addr.address,
            floor=addr.floor, apartment=addr.apartment
        ) if addr else None,
        "customer_phone": order.customer_phone,
        "customer_details": order.customer_details,
    }
