"""ETA calculation based on distance and delivery method"""
from math import radians, cos, sin, sqrt, atan2

# Speed in km/h by delivery method
SPEED_BY_METHOD = {
    "foot": 5,
    "bicycle": 15,
    "car": 40,
    "courier": 25,  # default courier speed
}

# Base preparation time in minutes (restaurant prepares order)
PREP_TIME_MIN = 15


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km"""
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c


def calculate_eta(
    from_lat: float, from_lon: float,
    to_lat: float, to_lon: float,
    method: str = "courier"
) -> tuple[float, int]:
    """
    Calculate distance and ETA in minutes.
    Returns (distance_km, eta_minutes)
    """
    distance = haversine_km(from_lat, from_lon, to_lat, to_lon)
    speed = SPEED_BY_METHOD.get(method, SPEED_BY_METHOD["courier"])

    # Time = distance / speed * 60 (convert hours to minutes)
    travel_time = (distance / speed) * 60

    # Total ETA = prep time + travel time
    eta = PREP_TIME_MIN + travel_time

    return round(distance, 2), round(eta)
