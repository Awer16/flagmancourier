import json
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from uuid import UUID

router = APIRouter(tags=["WebSocket"])


class ConnectionManager:
    def __init__(self):
        # channel -> set of websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)
            if not self.active_connections[channel]:
                del self.active_connections[channel]

    async def broadcast(self, channel: str, data: dict):
        """Send message to all connections in a channel"""
        if channel in self.active_connections:
            dead = set()
            for conn in self.active_connections[channel]:
                try:
                    await conn.send_json(data)
                except Exception:
                    dead.add(conn)
            for d in dead:
                self.active_connections[channel].discard(d)

    async def send_to_channel(self, channel: str, data: dict):
        """Send without requiring an active connection (fire and forget)"""
        if channel in self.active_connections:
            dead = set()
            for conn in self.active_connections[channel]:
                try:
                    await conn.send_json(data)
                except Exception:
                    dead.add(conn)
            for d in dead:
                self.active_connections[channel].discard(d)


manager = ConnectionManager()


@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    """
    WebSocket endpoint for real-time updates.

    Channels:
    - order_{order_id}      — updates for a specific order
    - company_{company_id}  — new orders for a company
    - courier_{courier_id}  — new order notifications for a courier
    - global_orders         — all new orders (for any active courier)
    - company_orders        — all order status updates for companies
    """
    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep connection alive, optionally receive messages
            raw = await websocket.receive_text()
            try:
                parsed = json.loads(raw)
                if parsed.get("type") == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)


async def notify_new_order(order_data: dict, company_id: str):
    """Notify company about new order AND all couriers about available order"""
    # Notify the company
    await manager.send_to_channel(f"company_{company_id}", {
        "type": "new_order",
        "order": order_data,
    })

    # Notify all couriers
    await manager.send_to_channel("global_orders", {
        "type": "order_available",
        "order_preview": {
            "id": order_data["id"],
            "company_name": order_data.get("company_name", ""),
            "company_address": order_data.get("company_address", ""),
            "total_amount": order_data.get("total_amount", "0"),
            "distance_km": order_data.get("distance_km"),
            "eta_minutes": order_data.get("eta_minutes"),
            "status": order_data.get("status", "pending"),
            "created_at": order_data.get("created_at"),
        },
    })


async def notify_order_status(order_id: str, status: str, courier_id: str = None):
    """Notify about order status change"""
    data = {
        "type": "order_status_update",
        "order_id": order_id,
        "status": status,
    }
    await manager.send_to_channel(f"order_{order_id}", data)

    # Also notify company
    await manager.send_to_channel(f"company_orders", data)

    # Notify specific courier
    if courier_id:
        await manager.send_to_channel(f"courier_{courier_id}", data)
