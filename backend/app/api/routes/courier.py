from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import (
    User, CourierSession, Order, Company,
    CourierSessionStatus, OrderStatus, ModerationStatus
)
from app.schemas import CourierSessionResponse, CourierOrderPreview, OrderFullResponse
from app.api.dependencies import get_current_user as get_current_user_dep

router = APIRouter(prefix="/courier", tags=["Courier"])


@router.get("/profile", response_model=dict)
async def get_courier_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await db.refresh(current_user)
    return {
        "balance": current_user.balance or "0.00",
        "first_name": current_user.first_name,
        "role": current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
    }


@router.post("/session/start", response_model=CourierSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    city: str = "Ростов-на-Дону",
    district: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    if current_user.moderation_status != ModerationStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Courier not approved by moderator")

    # Проверить активную сессию
    result = await db.execute(
        select(CourierSession).where(
            CourierSession.courier_id == current_user.id,
            CourierSession.status == CourierSessionStatus.ACTIVE
        )
    )
    active = result.scalar_one_or_none()
    if active:
        raise HTTPException(status_code=400, detail="Session already active")

    session = CourierSession(
        courier_id=current_user.id,
        status=CourierSessionStatus.ACTIVE,
        city=city,
        district=district,
    )
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.post("/session/end", response_model=CourierSessionResponse)
async def end_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    # Check for active orders
    active_result = await db.execute(
        select(Order).where(
            Order.courier_id == current_user.id,
            Order.status.in_([
                OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP,
                OrderStatus.PICKED_UP, OrderStatus.IN_DELIVERY
            ])
        )
    )
    if active_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Нельзя завершить смену с активным заказом. Завершите текущую доставку.")

    result = await db.execute(
        select(CourierSession).where(
            CourierSession.courier_id == current_user.id,
            CourierSession.status == CourierSessionStatus.ACTIVE
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="No active session")

    session.status = CourierSessionStatus.COMPLETED
    session.ended_at = datetime.utcnow()
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/session", response_model=CourierSessionResponse)
async def get_session(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(CourierSession).where(
            CourierSession.courier_id == current_user.id,
            CourierSession.status == CourierSessionStatus.ACTIVE
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="No active session")
    return session


@router.get("/orders/available", response_model=list[CourierOrderPreview])
async def get_available_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    # Проверить активную сессию
    session = await _get_active_session(db, current_user.id)

    # Проверить что курьер не занят другим заказом
    busy = await db.execute(
        select(Order).where(
            Order.courier_id == current_user.id,
            Order.status.in_([OrderStatus.ACCEPTED, OrderStatus.PICKED_UP, OrderStatus.IN_DELIVERY])
        )
    )
    if busy.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already have an active delivery")

    # Доступные заказы — подтверждённые рестораном (confirmed)
    query = (
        select(Order, Company.name, Company.address, Company.city)
        .select_from(Order)
        .join(Company, Order.company_id == Company.id)
        .where(Order.status.in_([OrderStatus.CONFIRMED, OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP]))
    )

    # Фильтр по городу курьера
    if session.city:
        query = query.where(Order.city == session.city)

    # Фильтр по району курьера
    if session.district:
        query = query.where(Order.district == session.district)

    result = await db.execute(query.order_by(Order.created_at.desc()))
    rows = result.all()

    previews = []
    for order, company_name, company_address, company_city in rows:
        previews.append(CourierOrderPreview(
            id=order.id,
            company_name=company_name,
            company_address=company_address,
            total_amount=order.total_amount,
            distance_km=order.distance_km,
            status=order.status.value if hasattr(order.status, 'value') else str(order.status),
            created_at=order.created_at,
        ))
    return previews


@router.post("/orders/{order_id}/accept", response_model=OrderFullResponse)
async def accept_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_active_session(db, current_user.id)

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status not in [OrderStatus.CONFIRMED, OrderStatus.ACCEPTED]:
        raise HTTPException(status_code=400, detail="Order not available")

    order.courier_id = current_user.id
    order.status = OrderStatus.ACCEPTED
    await db.flush()
    await db.refresh(order)

    # Notify
    from app.api.routes.websocket import notify_order_status
    await notify_order_status(str(order.id), "accepted", str(current_user.id))

    # Вернуть с адресом и деталями
    return await _get_full_order(db, order)


@router.patch("/orders/{order_id}/status", response_model=OrderFullResponse)
async def update_order_status(
    order_id: UUID,
    status_new: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.courier_id == current_user.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    status_map = {
        "picked_up": OrderStatus.PICKED_UP,
        "in_delivery": OrderStatus.IN_DELIVERY,
        "delivered": OrderStatus.DELIVERED,
    }
    if status_new not in status_map:
        raise HTTPException(status_code=400, detail=f"Invalid status. Use: {list(status_map.keys())}")

    # Курьер может обновить статус только если заказ уже готов (ready_for_pickup) или если он его забрал
    if order.status not in [OrderStatus.READY_FOR_PICKUP, OrderStatus.PICKED_UP, OrderStatus.IN_DELIVERY]:
        raise HTTPException(status_code=400, detail=f"Cannot update status from {order.status.value if hasattr(order.status, 'value') else order.status}")

    order.status = status_map[status_new]
    
    # Calculate and add earnings on delivery
    if status_new == "delivered":
        dist = float(order.distance_km or 0)
        earnings = min(200.0, max(120.0, 120.0 + (dist * 8.0)))
        order.courier_earnings = str(round(earnings, 2))
        # Add to courier balance
        current_balance = float(current_user.balance or 0)
        current_user.balance = str(round(current_balance + earnings, 2))

    await db.flush()
    await db.refresh(order)

    # Notify
    from app.api.routes.websocket import notify_order_status
    await notify_order_status(str(order.id), status_new, str(current_user.id))

    return await _get_full_order(db, order)


@router.get("/orders/completed", response_model=list[OrderFullResponse])
async def get_completed_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(
            Order.courier_id == current_user.id,
            Order.status == OrderStatus.DELIVERED
        ).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return [await _get_full_order(db, o) for o in orders]


@router.get("/orders/my", response_model=list[OrderFullResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Order).where(
            Order.courier_id == current_user.id,
            Order.status.in_([OrderStatus.SEARCHING_COURIER, OrderStatus.ACCEPTED, OrderStatus.PICKED_UP, OrderStatus.IN_DELIVERY])
        ).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    return [await _get_full_order(db, o) for o in orders]


async def _get_active_session(db: AsyncSession, courier_id: UUID) -> CourierSession:
    result = await db.execute(
        select(CourierSession).where(
            CourierSession.courier_id == courier_id,
            CourierSession.status == CourierSessionStatus.ACTIVE
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="No active session. Start session first.")
    return session


async def _get_full_order(db: AsyncSession, order: Order) -> dict:
    """Собрать полный ответ заказа с адресом"""
    from app.schemas import OrderFullResponse, OrderItemResponse, DeliveryAddressResponse
    from app.models import OrderItem, DeliveryAddress

    addr_result = await db.execute(
        select(DeliveryAddress).where(DeliveryAddress.id == order.delivery_address_id)
    )
    addr = addr_result.scalar_one_or_none()

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
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
            OrderItemResponse(
                id=i.id, menu_item_id=i.menu_item_id,
                quantity=i.quantity, price_at_order=i.price_at_order
            ) for i in items
        ],
        "delivery_address": DeliveryAddressResponse(
            id=addr.id, label=addr.label, address=addr.address,
            floor=addr.floor, apartment=addr.apartment
        ) if addr else None,
        "customer_phone": order.customer_phone,
        "customer_details": order.customer_details,
    }
