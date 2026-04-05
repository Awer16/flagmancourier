from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import Company, MenuItem, DeliveryZone, Order, User, ModerationStatus, OrderStatus
from app.schemas import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    DeliveryZoneCreate, DeliveryZoneResponse,
    OrderResponse,
    PromoCodeCreate, PromoCodeResponse
)
from app.api.dependencies import get_current_user as get_current_user_dep, get_current_owner_or_enterprise

router = APIRouter(prefix="/owner", tags=["Company Owner"])


# ============ COMPANIES ============
@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    from app.models import CompanyType
    import re
    
    company_type_map = {
        "restaurant": CompanyType.RESTAURANT,
        "store": CompanyType.STORE,
        "cafe": CompanyType.CAFE,
        "grocery": CompanyType.GROCERY,
        "bakery": CompanyType.BAKERY,
        "other": CompanyType.OTHER,
    }
    company_type = company_type_map.get(data.company_type.lower(), CompanyType.RESTAURANT)
    
    # Generate slug from name
    slug = re.sub(r'[^a-zа-яё0-9\s-]', '', data.name.lower().replace(' ', '-'))
    slug = slug.replace('ё', 'e').replace('а', 'a').replace('б', 'b').replace('в', 'v').replace('г', 'g').replace('д', 'd').replace('е', 'e').replace('ж', 'zh').replace('з', 'z').replace('и', 'i').replace('й', 'y').replace('к', 'k').replace('л', 'l').replace('м', 'm').replace('н', 'n').replace('о', 'o').replace('п', 'p').replace('р', 'r').replace('с', 's').replace('т', 't').replace('у', 'u').replace('ф', 'f').replace('х', 'kh').replace('ц', 'ts').replace('ч', 'ch').replace('ш', 'sh').replace('щ', 'shch').replace('ъ', '').replace('ы', 'y').replace('ь', '').replace('э', 'e').replace('ю', 'yu').replace('я', 'ya')
    
    company = Company(
        owner_id=current_user.id,
        name=data.name,
        slug=slug,
        company_type=company_type,
        description=data.description,
        address=data.address,
        city=data.city,
        latitude=data.latitude,
        longitude=data.longitude,
        phone=data.phone,
        moderation_status=ModerationStatus.APPROVED,
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return company


@router.get("/companies", response_model=list[CompanyResponse])
async def get_my_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(Company).where(Company.owner_id == current_user.id))
    return result.scalars().all()


@router.get("/companies/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.patch("/companies/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: UUID,
    data: CompanyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == current_user.id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)

    await db.flush()
    await db.refresh(company)
    return company


# ============ MENU ============
@router.post("/companies/{company_id}/menu", response_model=MenuItemResponse, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    company_id: UUID,
    data: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    company = await _get_user_company(db, company_id, current_user.id)
    item = MenuItem(
        company_id=company.id,
        name=data.name,
        description=data.description,
        price=data.price,
        old_price=data.old_price,
        category=data.category.lower() if data.category else "other",
        image_url=data.image_url,
        is_available=True,
        moderation_status=ModerationStatus.APPROVED,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.get("/companies/{company_id}/menu", response_model=list[MenuItemResponse])
async def get_menu(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    result = await db.execute(select(MenuItem).where(MenuItem.company_id == company_id))
    return result.scalars().all()


@router.patch("/companies/{company_id}/menu/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    company_id: UUID,
    item_id: UUID,
    data: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.company_id == company_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return item


@router.delete("/companies/{company_id}/menu/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    company_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.company_id == company_id)
    )
    item = result.scalar_one_or_none()
    if item:
        await db.delete(item)


# ============ DELIVERY ZONES ============
@router.post("/companies/{company_id}/zones", response_model=DeliveryZoneResponse, status_code=status.HTTP_201_CREATED)
async def create_zone(
    company_id: UUID,
    data: DeliveryZoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    zone = DeliveryZone(
        company_id=company_id,
        name=data.name,
        center_latitude=data.center_latitude,
        center_longitude=data.center_longitude,
        radius_km=data.radius_km,
    )
    db.add(zone)
    await db.flush()
    await db.refresh(zone)
    return zone


@router.get("/companies/{company_id}/zones", response_model=list[DeliveryZoneResponse])
async def get_zones(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    result = await db.execute(select(DeliveryZone).where(DeliveryZone.company_id == company_id))
    return result.scalars().all()


# ============ ORDERS ============
@router.get("/companies/{company_id}/orders", response_model=list[OrderResponse])
async def get_company_orders(
    company_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    await _get_user_company(db, company_id, current_user.id)
    result = await db.execute(select(Order).where(Order.company_id == company_id))
    return result.scalars().all()


@router.post("/orders/{order_id}/confirm", response_model=OrderResponse)
async def confirm_order(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_owner_or_enterprise)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Normalize role - may be enum or string depending on SQLAlchemy version
    user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

    # Enterprise users can confirm any pending order
    if user_role == "company_owner":
        company_result = await db.execute(select(Company).where(Company.id == order.company_id, Company.owner_id == current_user.id))
        company = company_result.scalar_one_or_none()
        if not company:
            raise HTTPException(status_code=403, detail="Access denied")

    # Get order status as string for comparison
    order_status = order.status.value if hasattr(order.status, 'value') else str(order.status)

    if order_status != "pending":
        raise HTTPException(status_code=400, detail=f"Order cannot be confirmed (current status: {order_status})")

    order.status = OrderStatus.CONFIRMED
    await db.flush()
    await db.refresh(order)
    return order


@router.post("/orders/{order_id}/ready", response_model=OrderResponse)
async def order_ready_for_pickup(
    order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order belongs to one of the user's companies
    company_result = await db.execute(select(Company).where(Company.id == order.company_id, Company.owner_id == current_user.id))
    company = company_result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=403, detail="Access denied")

    order_status = order.status.value if hasattr(order.status, 'value') else str(order.status)
    if order_status not in ["accepted", "confirmed"]:
        raise HTTPException(status_code=400, detail=f"Заказ ещё не готов к выдаче (текущий статус: {order_status})")

    order.status = OrderStatus.READY_FOR_PICKUP
    await db.flush()
    await db.refresh(order)
    
    # Notify couriers — now couriers can see and accept this order
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
        print(f"WebSocket notification failed: {e}")
    
    return order


# ============ PROMO CODES ============
from app.models import PromoCode
from datetime import datetime

@router.post("/promocodes", response_model=PromoCodeResponse, status_code=201)
async def create_promocode(
    data: PromoCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    pc = PromoCode(
        code=data.code.upper(),
        discount_percent=data.discount_percent,
        min_order_amount=data.min_order_amount,
        max_uses=data.max_uses,
        expires_at=datetime.fromisoformat(data.expires_at) if data.expires_at else None,
        company_id=data.company_id,
    )
    db.add(pc)
    await db.flush()
    await db.refresh(pc)
    return pc


@router.get("/promocodes", response_model=list[PromoCodeResponse])
async def get_promocodes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(PromoCode).order_by(PromoCode.created_at.desc()))
    return result.scalars().all()


@router.delete("/promocodes/{pc_id}", status_code=204)
async def delete_promocode(
    pc_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(PromoCode).where(PromoCode.id == pc_id))
    pc = result.scalar_one_or_none()
    if pc:
        await db.delete(pc)


async def _get_user_company(db: AsyncSession, company_id: UUID, owner_id: UUID) -> Company:
    result = await db.execute(
        select(Company).where(Company.id == company_id, Company.owner_id == owner_id)
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found or access denied")
    if company.is_blocked:
        raise HTTPException(status_code=403, detail="Company is blocked")
    return company
