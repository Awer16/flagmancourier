import sys
sys.path.insert(0, r'C:\Users\Awer.rror\Courier.Here\backend')

import asyncio
from app.db.database import async_session
from app.models import User, Company, MenuItem, DeliveryAddress, Order, OrderItem, DeliveryZone
from app.core.security import verify_password
from sqlalchemy import select

async def test():
    async with async_session() as session:
        # Find customer
        result = await session.execute(select(User).where(User.email == "customer@test.com"))
        customer = result.scalar_one_or_none()
        print(f"Customer: {customer.id}, {customer.first_name}")

        # Find company
        result = await session.execute(select(Company).where(Company.name == 'Кафе "Флагман"'))
        company = result.scalar_one_or_none()
        print(f"Company: {company.id}, {company.city}")

        # Find menu item
        result = await session.execute(select(MenuItem).where(MenuItem.name == "Борщ"))
        item = result.scalar_one_or_none()
        print(f"Menu item: {item.id}, {item.price}")

        # Create address
        addr = DeliveryAddress(
            user_id=customer.id,
            address="ул. Пушкина 10",
            latitude="47.2357",
            longitude="39.7015",
        )
        session.add(addr)
        await session.flush()
        print(f"Address: {addr.id}")

        # Check zones
        result = await session.execute(select(DeliveryZone).where(DeliveryZone.company_id == company.id))
        zones = result.scalars().all()
        print(f"Zones: {len(zones)}")
        for z in zones:
            print(f"  {z.name}: center=({z.center_latitude}, {z.center_longitude}), radius={z.radius_km}km")

        # Try haversine
        from app.core.eta import haversine_km
        dist = haversine_km(float(zones[0].center_latitude), float(zones[0].center_longitude), float(addr.latitude), float(addr.longitude))
        print(f"Distance: {dist} km")

        # Try district
        from app.core.districts import get_rostov_district
        district = get_rostov_district(float(addr.latitude), float(addr.longitude))
        print(f"District: {district}")

        # Create order
        order = Order(
            customer_id=customer.id,
            company_id=company.id,
            delivery_address_id=addr.id,
            total_amount="500",
            original_amount="500",
            delivery_fee="70",
            distance_km=str(round(dist, 2)),
            eta_minutes=str(15 + round((dist / 25) * 60)),
            customer_phone=customer.phone,
            customer_details=f"{customer.first_name} {customer.last_name or ''}".strip(),
            delivery_latitude=addr.latitude,
            delivery_longitude=addr.longitude,
            city=company.city,
            district=district if company.city == "Ростов-на-Дону" else None,
        )
        session.add(order)
        await session.flush()
        print(f"Order created: {order.id}")

        # Create order item
        oi = OrderItem(
            order_id=order.id,
            menu_item_id=item.id,
            quantity="2",
            price_at_order=item.price,
        )
        session.add(oi)
        await session.commit()
        print(f"Order item created: {oi.id}")
        print("SUCCESS!")

asyncio.run(test())
