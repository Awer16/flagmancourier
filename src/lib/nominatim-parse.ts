const UA =
  "CourierHere/1.0 (+https://www.openstreetmap.org/copyright; address autocomplete)";

export function nominatimFetchHeaders(): HeadersInit {
  return {
    "User-Agent": UA,
    Accept: "application/json",
    "Accept-Language": "ru,en;q=0.8",
  };
}

export function labelFromNominatimAddress(
  addr: unknown,
): string | null {
  if (!addr || typeof addr !== "object") {
    return null;
  }
  const a = addr as Record<string, string>;
  const house = a.house_number?.trim();
  const road = (a.road ?? a.pedestrian ?? a.path ?? a.footway)?.trim();
  const line1 =
    road && house ? `${road}, ${house}` : road || house || undefined;
  const parts = [
    line1,
    (a.suburb ?? a.neighbourhood ?? a.quarter)?.trim(),
    (a.city ?? a.town ?? a.village ?? a.municipality)?.trim(),
    a.state?.trim(),
    a.country?.trim(),
  ].filter((p): p is string => Boolean(p));
  const s = parts.join(", ");
  return s.length > 0 ? s : null;
}
