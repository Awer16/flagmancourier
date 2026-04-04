import { nominatimFetchHeaders } from "@/lib/nominatim-parse";
import { NextResponse } from "next/server";

type NominatimRow = { display_name: string; lat: string; lon: string };

function mapRows(data: NominatimRow[]): Array<{
  label: string;
  lat: number;
  lon: number;
}> {
  return data
    .filter(
      (item): item is NominatimRow =>
        typeof item.display_name === "string" &&
        item.display_name.trim().length > 0 &&
        typeof item.lat === "string" &&
        typeof item.lon === "string",
    )
    .map((item) => ({
      label: item.display_name.trim(),
      lat: Number.parseFloat(item.lat),
      lon: Number.parseFloat(item.lon),
    }))
    .filter((x) => Number.isFinite(x.lat) && Number.isFinite(x.lon));
}

async function fetchNominatimSearch(
  searchParams: URLSearchParams,
): Promise<NominatimRow[]> {
  const u = new URL("https://nominatim.openstreetmap.org/search");
  u.searchParams.set("format", "json");
  u.searchParams.set("limit", "10");
  u.searchParams.set("countrycodes", "ru");
  u.searchParams.set("addressdetails", "0");
  searchParams.forEach((value, key) => {
    u.searchParams.set(key, value);
  });
  const res = await fetch(u.toString(), {
    headers: nominatimFetchHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    return [];
  }
  return data as NominatimRow[];
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  if (city.length > 0) {
    if (q.length < 2) {
      return NextResponse.json([]);
    }
    try {
      const p1 = new URLSearchParams();
      p1.set("q", `${city}, ${q}`);
      let rows = await fetchNominatimSearch(p1);
      if (rows.length === 0) {
        const p2 = new URLSearchParams();
        p2.set("q", `${q}, ${city}, Россия`);
        rows = await fetchNominatimSearch(p2);
      }
      if (rows.length === 0) {
        const p3 = new URLSearchParams();
        p3.set("street", q);
        p3.set("city", city);
        p3.set("country", "Россия");
        rows = await fetchNominatimSearch(p3);
      }
      return NextResponse.json(mapRows(rows));
    } catch {
      return NextResponse.json([]);
    }
  }

  if (q.length < 3) {
    return NextResponse.json([]);
  }
  try {
    const free = new URLSearchParams();
    free.set("q", q);
    const rows = await fetchNominatimSearch(free);
    return NextResponse.json(mapRows(rows));
  } catch {
    return NextResponse.json([]);
  }
}
