from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models import (
    User, Company, MenuItem, Order, CourierSession,
    ModerationStatus, OrderStatus, UserRole, CourierSessionStatus
)
from app.schemas import CompanyResponse, MenuItemResponse, UserResponse, ModerationAction, ModerationStats
from app.api.dependencies import get_current_user as get_current_user_dep

router = APIRouter(prefix="/moderator", tags=["Moderator"])


# ============ COMPANIES MODERATION ============
@router.get("/companies/pending", response_model=list[CompanyResponse])
async def get_pending_companies(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(Company).where(Company.moderation_status == ModerationStatus.PENDING)
    )
    return result.scalars().all()


@router.post("/companies/{company_id}/moderate", response_model=CompanyResponse)
async def moderate_company(
    company_id: UUID,
    action: ModerationAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    if action.action == "approve":
        company.moderation_status = ModerationStatus.APPROVED
    elif action.action == "reject":
        company.moderation_status = ModerationStatus.REJECTED
    elif action.action == "block":
        company.is_blocked = True
        company.moderation_status = ModerationStatus.BLOCKED
    elif action.action == "unblock":
        company.is_blocked = False
        company.moderation_status = ModerationStatus.APPROVED

    await db.flush()
    await db.refresh(company)
    return company


# ============ MENU MODERATION ============
@router.get("/menu/pending", response_model=list[MenuItemResponse])
async def get_pending_menu_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.moderation_status == ModerationStatus.PENDING)
    )
    return result.scalars().all()


@router.post("/menu/{item_id}/moderate", response_model=MenuItemResponse)
async def moderate_menu_item(
    item_id: UUID,
    action: ModerationAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    if action.action == "approve":
        item.moderation_status = ModerationStatus.APPROVED
    elif action.action == "reject":
        item.moderation_status = ModerationStatus.REJECTED
    elif action.action == "block":
        item.moderation_status = ModerationStatus.BLOCKED
        item.is_available = False

    await db.flush()
    await db.refresh(item)
    return item


# ============ COURIER MODERATION ============
@router.get("/couriers/pending", response_model=list[UserResponse])
async def get_pending_couriers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(
        select(User).where(
            User.role == UserRole.COURIER,
            User.moderation_status == ModerationStatus.PENDING
        )
    )
    return result.scalars().all()


@router.post("/couriers/{courier_id}/moderate", response_model=UserResponse)
async def moderate_courier(
    courier_id: UUID,
    action: ModerationAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    result = await db.execute(select(User).where(User.id == courier_id, User.role == UserRole.COURIER))
    courier = result.scalar_one_or_none()
    if not courier:
        raise HTTPException(status_code=404, detail="Courier not found")

    if action.action == "approve":
        courier.moderation_status = ModerationStatus.APPROVED
    elif action.action == "reject":
        courier.moderation_status = ModerationStatus.REJECTED
    elif action.action == "block":
        courier.is_blocked = True
    elif action.action == "unblock":
        courier.is_blocked = False
        courier.moderation_status = ModerationStatus.APPROVED

    await db.flush()
    await db.refresh(courier)
    return courier


# ============ ORDERS VIEW ============
@router.get("/orders", response_model=list[dict])
async def get_all_orders(
    status_filter: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    query = select(Order)
    if status_filter:
        status_enum = OrderStatus[status_filter.upper()]
        query = query.where(Order.status == status_enum)

    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


# ============ ANALYTICS ============
@router.get("/stats", response_model=ModerationStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    companies_pending = await db.scalar(
        select(func.count()).select_from(Company).where(Company.moderation_status == ModerationStatus.PENDING)
    )
    menu_pending = await db.scalar(
        select(func.count()).select_from(MenuItem).where(MenuItem.moderation_status == ModerationStatus.PENDING)
    )
    couriers_pending = await db.scalar(
        select(func.count()).select_from(User).where(
            User.role == UserRole.COURIER, User.moderation_status == ModerationStatus.PENDING
        )
    )
    total_orders = await db.scalar(select(func.count()).select_from(Order))
    active_couriers = await db.scalar(
        select(func.count(CourierSession.courier_id.distinct())).select_from(CourierSession).where(
            CourierSession.status == CourierSessionStatus.ACTIVE
        )
    )

    return ModerationStats(
        companies_pending=companies_pending or 0,
        menu_items_pending=menu_pending or 0,
        couriers_pending=couriers_pending or 0,
        total_orders=total_orders or 0,
        active_couriers=active_couriers or 0,
    )
