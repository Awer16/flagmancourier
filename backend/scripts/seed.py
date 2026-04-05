"""Seed script with test users and ~10 restaurants across different cities"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import async_session
from app.models import Company, MenuItem, DeliveryZone, PromoCode, ModerationStatus, UserRole
from app.core.security import get_password_hash
from sqlalchemy import select

# ============================================================
# TEST USERS
# ============================================================
TEST_USERS = [
    {
        "email": "customer@test.com",
        "password": "customer123",
        "phone": "+79991112233",
        "first_name": "Иван",
        "last_name": "Покупатель",
        "role": UserRole.CUSTOMER,
    },
    {
        "email": "courier@test.com",
        "password": "courier123",
        "phone": "+79992223344",
        "first_name": "Алексей",
        "last_name": "Курьеров",
        "role": UserRole.COURIER,
    },
    {
        "email": "owner@test.com",
        "password": "owner123",
        "phone": "+79993334455",
        "first_name": "Мария",
        "last_name": "Ресторанова",
        "role": UserRole.COMPANY_OWNER,
    },
    {
        "email": "enterprise@test.com",
        "password": "enterprise123",
        "phone": "+79995556677",
        "first_name": "Олег",
        "last_name": "Предприниматель",
        "role": UserRole.ENTERPRISE,
    },
    {
        "email": "moderator@test.com",
        "password": "moderator123",
        "phone": "+79994445566",
        "first_name": "Дмитрий",
        "last_name": "Модераторов",
        "role": UserRole.MODERATOR,
    },
]

# ============================================================
# RESTAURANTS
# ============================================================
RESTAURANTS = [
    # Москва
    {
        "name": "Бургерная #1",
        "slug": "burgernaya-1",
        "description": "Сочные бургеры и крафтовое пиво",
        "address": "ул. Тверская, 15, Москва",
        "city": "Москва",
        "lat": "55.7558", "lon": "37.6173",
        "phone": "+74951234567",
        "menu": [
            {"name": "Классический бургер", "price": "350", "category": "main", "desc": "Говядина, сыр, овощи"},
            {"name": "Чизбургер", "price": "420", "old_price": "500", "category": "main", "desc": "Двойной сыр"},
            {"name": "Картофель фри", "price": "180", "category": "snacks", "desc": "Хрустящий"},
            {"name": "Лимонад", "price": "200", "category": "drinks", "desc": "Домашний"},
        ]
    },
    {
        "name": "Суши Мастер",
        "description": "Свежие суши и роллы с доставкой",
        "address": "ул. Арбат, 22, Москва",
        "city": "Москва",
        "lat": "55.7522", "lon": "37.5925",
        "phone": "+74957654321",
        "menu": [
            {"name": "Филадельфия", "price": "520", "category": "main", "desc": "Лосось, сливочный сыр"},
            {"name": "Калифорния", "price": "450", "category": "main", "desc": "Краб, авокадо"},
            {"name": "Мисо суп", "price": "250", "category": "soups", "desc": "Классический"},
            {"name": "Зелёный чай", "price": "150", "category": "drinks", "desc": "Сенча"},
        ]
    },
    # Санкт-Петербург
    {
        "name": "Пышечная",
        "description": "Пышки и сладости по рецепту 1958 года",
        "address": "Большая Конюшенная, 25, СПб",
        "city": "Санкт-Петербург",
        "lat": "59.9343", "lon": "30.3351",
        "phone": "+78121234567",
        "menu": [
            {"name": "Пышка классическая", "price": "80", "category": "desserts", "desc": "С сахарной пудрой"},
            {"name": "Пышка с начинкой", "price": "120", "category": "desserts", "desc": "Сгущёнка"},
            {"name": "Кофе", "price": "180", "category": "drinks", "desc": "Американо"},
        ]
    },
    {
        "name": "Шаурма у Ашота",
        "description": "Лучшая шаурма в Питере",
        "address": "Невский пр., 100, СПб",
        "city": "Санкт-Петербург",
        "lat": "59.9289", "lon": "30.3612",
        "phone": "+78129876543",
        "menu": [
            {"name": "Шаурма классическая", "price": "280", "category": "main", "desc": "Курица, овощи, соус"},
            {"name": "Шаурма большая", "price": "380", "category": "main", "desc": "Двойное мясо"},
            {"name": "Картошка по-деревенски", "price": "150", "category": "snacks", "desc": "С чесноком"},
        ]
    },
    # Ростов-на-Дону
    {
        "name": 'Кафе "Флагман"',
        "description": "Домашняя кухня и вкусные обеды",
        "address": "ул. Пушкина, 10, Ростов-на-Дону",
        "city": "Ростов-на-Дону",
        "lat": "47.2357", "lon": "39.7015",
        "phone": "+79991112233",
        "menu": [
            {"name": "Борщ", "price": "250", "category": "soups", "desc": "Классический борщ со сметаной"},
            {"name": "Пельмени", "price": "320", "category": "main", "desc": "Домашние пельмени"},
            {"name": "Цезарь", "price": "280", "category": "salads", "desc": "Салат Цезарь с курицей"},
            {"name": "Компот", "price": "90", "category": "drinks", "desc": "Домашний компот"},
            {"name": "Пирожное", "price": "150", "old_price": "200", "category": "desserts", "desc": "Шоколадное пирожное"},
            {"name": "Гречка с котлетой", "price": "220", "category": "main", "desc": "Гречка с домашней котлетой"},
        ]
    },
    {
        "name": 'Пиццерия "Небо"',
        "description": "Лучшая пицца в городе, доставка за 30 минут",
        "address": "пр. Стачки, 55, Ростов-на-Дону",
        "city": "Ростов-на-Дону",
        "lat": "47.2210", "lon": "39.7150",
        "phone": "+79994445566",
        "menu": [
            {"name": "Маргарита", "price": "450", "category": "main", "desc": "Томаты, моцарелла, базилик"},
            {"name": "Пепперони", "price": "520", "old_price": "600", "category": "main", "desc": "Пепперони, моцарелла"},
            {"name": "Четыре сыра", "price": "590", "category": "main", "desc": "Моцарелла, горгонзола, пармезан"},
            {"name": "Карбонара", "price": "480", "category": "main", "desc": "Бекон, сливки, пармезан"},
            {"name": "Цезарь", "price": "320", "category": "salads", "desc": "Романо, курица, пармезан"},
            {"name": "Кола", "price": "120", "category": "drinks", "desc": "Coca-Cola 0.5л"},
            {"name": "Тирамису", "price": "280", "category": "desserts", "desc": "Классический тирамису"},
        ]
    },
    # Казань
    {
        "name": "Татарская кухня",
        "description": "Аутентичные татарские блюда",
        "address": "ул. Баумана, 36, Казань",
        "city": "Казань",
        "lat": "55.7907", "lon": "49.1155",
        "phone": "+78431234567",
        "menu": [
            {"name": "Эчпочмак", "price": "120", "category": "main", "desc": "С мясом и картошкой"},
            {"name": "Бэлеш", "price": "350", "category": "main", "desc": "Большой пирог с мясом"},
            {"name": "Чак-чак", "price": "200", "category": "desserts", "desc": "Традиционный"},
            {"name": "Кумыс", "price": "180", "category": "drinks", "desc": "Свежий"},
        ]
    },
    # Екатеринбург
    {
        "name": "Пельменная №1",
        "description": "Более 20 видов пельменей",
        "address": "ул. Вайнера, 12, Екатеринбург",
        "city": "Екатеринбург",
        "lat": "56.8380", "lon": "60.5975",
        "phone": "+73431234567",
        "menu": [
            {"name": "Пельмени классические", "price": "320", "category": "main", "desc": "Свинина+говядина"},
            {"name": "Пельмени с курицей", "price": "280", "category": "main", "desc": "Лёгкие"},
            {"name": "Пельмени с рыбой", "price": "380", "category": "main", "desc": "Сёмга"},
            {"name": "Сметана", "price": "50", "category": "snacks", "desc": "Домашняя"},
        ]
    },
    # Новосибирск
    {
        "name": "Сибирские щи",
        "description": "Наваристые супы и сибирская кухня",
        "address": "Красный пр., 45, Новосибирск",
        "city": "Новосибирск",
        "lat": "55.0302", "lon": "82.9213",
        "phone": "+73831234567",
        "menu": [
            {"name": "Щи из квашеной капусты", "price": "220", "category": "soups", "desc": "Со сметаной"},
            {"name": "Солянка", "price": "310", "category": "soups", "desc": "Мясная"},
            {"name": "Позы", "price": "380", "category": "main", "desc": "Буузы, 4 шт"},
            {"name": "Морс", "price": "140", "category": "drinks", "desc": "Клюквенный"},
        ]
    },
    # Краснодар
    {
        "name": "Южный дворик",
        "description": "Кавказская и кубанская кухня",
        "address": "ул. Красная, 100, Краснодар",
        "city": "Краснодар",
        "lat": "45.0355", "lon": "38.9753",
        "phone": "+78611234567",
        "menu": [
            {"name": "Хинкали", "price": "85", "category": "main", "desc": "За штуку, с бараниной"},
            {"name": "Хачапури", "price": "380", "category": "main", "desc": "По-аджарски"},
            {"name": "Шашлык", "price": "420", "category": "main", "desc": "Свиной, 200г"},
            {"name": "Вино бокал", "price": "300", "category": "drinks", "desc": "Красное/белое"},
        ]
    },
]

CITIES = {
    "Москва": {"center_lat": "55.7558", "center_lon": "37.6173", "radius_km": "15"},
    "Санкт-Петербург": {"center_lat": "59.9343", "center_lon": "30.3351", "radius_km": "15"},
    "Ростов-на-Дону": {"center_lat": "47.2357", "center_lon": "39.7015", "radius_km": "10"},
    "Казань": {"center_lat": "55.7907", "center_lon": "49.1155", "radius_km": "12"},
    "Екатеринбург": {"center_lat": "56.8380", "center_lon": "60.5975", "radius_km": "12"},
    "Новосибирск": {"center_lat": "55.0302", "center_lon": "82.9213", "radius_km": "12"},
    "Краснодар": {"center_lat": "45.0355", "center_lon": "38.9753", "radius_km": "10"},
}


async def seed():
    async with async_session() as session:
        # ============================================================
        # CREATE TEST USERS
        # ============================================================
        print("=" * 60)
        print("  TEST USERS")
        print("=" * 60)

        created_users = {}

        for u_data in TEST_USERS:
            # Check by email using User model
            from app.models import User
            result = await session.execute(
                select(User).where(User.email == u_data["email"])
            )
            user = result.scalar_one_or_none()

            if not user:
                user = User(
                    email=u_data["email"],
                    password_hash=get_password_hash(u_data["password"]),
                    phone=u_data["phone"],
                    first_name=u_data["first_name"],
                    last_name=u_data["last_name"],
                    role=u_data["role"],
                    moderation_status=ModerationStatus.APPROVED,
                )
                session.add(user)
                await session.flush()
                created_users[u_data["role"].value] = user
                print(f"  ✓ {u_data['role'].value:20s}  {u_data['email']:35s}  /  {u_data['password']}")
            else:
                created_users[u_data["role"].value] = user
                print(f"  ≈ {u_data['role'].value:20s}  {u_data['email']:35s}  (exists)")

        print()

        # ============================================================
        # CREATE TEST PROMO CODES
        # ============================================================
        promo_codes = [
            {"code": "SALE20", "discount_percent": "20", "min_order_amount": "500", "max_uses": "100"},
            {"code": "FIRST", "discount_percent": "15", "min_order_amount": "300", "max_uses": "50"},
            {"code": "WELCOME", "discount_percent": "10", "min_order_amount": "0", "max_uses": "999"},
        ]

        print("  PROMO CODES")
        print("  " + "-" * 40)
        for pc_data in promo_codes:
            existing = await session.execute(
                select(PromoCode).where(PromoCode.code == pc_data["code"])
            )
            if not existing.scalar_one_or_none():
                pc = PromoCode(
                    code=pc_data["code"],
                    discount_percent=pc_data["discount_percent"],
                    min_order_amount=pc_data["min_order_amount"],
                    max_uses=pc_data["max_uses"],
                )
                session.add(pc)
                print(f"  ✓ {pc_data['code']:10s}  -{pc_data['discount_percent']}%  (от {pc_data['min_order_amount']}₽)")
            else:
                print(f"  ≈ {pc_data['code']:10s}  (exists)")

        await session.flush()

        # ============================================================
        # CREATE RESTAURANTS
        # ============================================================
        print()
        print("  RESTAURANTS")
        print("  " + "-" * 50)

        owner = created_users.get("company_owner")
        if not owner:
            print("  ⚠ No company owner found, skipping restaurants")
            await session.commit()
            return

        city_zones_created = set()
        total_menu_items = 0

        for r_data in RESTAURANTS:
            existing = await session.execute(
                select(Company).where(Company.name == r_data["name"])
            )
            company = existing.scalar_one_or_none()

            if company:
                print(f"  ≈ {r_data['name']:25s}  {r_data['city']:20s}  (exists)")
                continue

            company = Company(
                name=r_data["name"],
                description=r_data["description"],
                address=r_data["address"],
                city=r_data["city"],
                latitude=r_data["lat"],
                longitude=r_data["lon"],
                phone=r_data["phone"],
                owner_id=owner.id,
                moderation_status=ModerationStatus.APPROVED,
            )
            session.add(company)
            await session.flush()

            # Delivery zone for city
            if r_data["city"] not in city_zones_created:
                city_info = CITIES.get(r_data["city"], {})
                zone = DeliveryZone(
                    company_id=company.id,
                    name=f"Доставка — {r_data['city']}",
                    center_latitude=city_info.get("center_lat", r_data["lat"]),
                    center_longitude=city_info.get("center_lon", r_data["lon"]),
                    radius_km=city_info.get("radius_km", "10"),
                )
                session.add(zone)
                city_zones_created.add(r_data["city"])

            # Menu items
            for m_data in r_data["menu"]:
                session.add(MenuItem(
                    company_id=company.id,
                    name=m_data["name"],
                    price=m_data["price"],
                    old_price=m_data.get("old_price"),
                    category=m_data["category"],
                    description=m_data.get("desc"),
                    is_available=True,
                    moderation_status=ModerationStatus.APPROVED,
                ))
                total_menu_items += 1

            print(f"  ✓ {r_data['name']:25s}  {r_data['city']:20s}  ({len(r_data['menu'])} блюд)")

        await session.commit()
        print()
        print(f"  ✅ {len(RESTAURANTS)} ресторанов в {len(CITIES)} городах, {total_menu_items} блюд")
        print()
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(seed())
