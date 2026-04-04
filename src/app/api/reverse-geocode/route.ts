import {
  labelFromNominatimAddress,
  nominatimFetchHeaders,
} from "@/lib/nominatim-parse";
import { NextResponse } from "next/server";

interface NominatimReversePayload {
  error?: string;
  display_name?: string;
  address?: Record<string, string>;
}

function pickLabel(data: NominatimReversePayload): string | null {
  const dn = data.display_name?.trim();
  if (dn) {
    return dn;
  }
  return labelFromNominatimAddress(data.address);
}

async function reverseAtZoom(
  lat: number,
  lon: number,
  zoom: string,
): Promise<string | null> {
  const u = new URL("https://nominatim.openstreetmap.org/reverse");
  u.searchParams.set("format", "json");
  u.searchParams.set("lat", String(lat));
  u.searchParams.set("lon", String(lon));
  u.searchParams.set("zoom", zoom);
  u.searchParams.set("addressdetails", "1");
  u.searchParams.set("accept-language", "ru,en");
  const res = await fetch(u.toString(), {
    headers: nominatimFetchHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as NominatimReversePayload;
  if (typeof data.error === "string" && data.error.length > 0) {
    return null;
  }
  return pickLabel(data);
}

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "invalid_coords" },
      { status: 400 },
    );
  }
  try {
    const label =
      (await reverseAtZoom(lat, lon, "18")) ??
      (await reverseAtZoom(lat, lon, "14"));
    return NextResponse.json({ label });
  } catch {
    return NextResponse.json({ label: null });
  }
}
