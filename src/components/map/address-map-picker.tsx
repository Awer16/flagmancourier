"use client";

import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface AddressMapPickerProps {
  lat: number;
  lon: number;
  zoom: number;
  cityId: string;
  onLocationChange: (lat: number, lon: number) => void;
  className?: string;
}

function fixLeafletDefaultIcon(): void {
  const proto = L.Icon.Default.prototype as unknown as {
    _getIconUrl?: string;
  };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export default function AddressMapPicker({
  lat,
  lon,
  zoom,
  cityId,
  onLocationChange,
  className,
}: AddressMapPickerProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const initialView = useRef({ lat, lon, zoom });
  const prevCityIdRef = useRef<string | null>(null);

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }
    const { lat: startLat, lon: startLon, zoom: startZoom } =
      initialView.current;
    fixLeafletDefaultIcon();
    const map = L.map(containerRef.current, {
      center: [startLat, startLon],
      zoom: startZoom,
      scrollWheelZoom: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);
    mapRef.current = map;
    markerRef.current = L.marker([startLat, startLon]).addTo(map);
    map.on("click", (e) => {
      const { lat: nextLat, lng: nextLon } = e.latlng;
      onLocationChangeRef.current(nextLat, nextLon);
    });
    const invalidate = (): void => {
      map.invalidateSize();
    };
    requestAnimationFrame(invalidate);
    window.addEventListener("resize", invalidate);
    return () => {
      window.removeEventListener("resize", invalidate);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) {
      return;
    }
    marker.setLatLng([lat, lon]);
    if (prevCityIdRef.current !== cityId) {
      prevCityIdRef.current = cityId;
      map.setView([lat, lon], zoom);
    } else {
      map.panTo([lat, lon]);
    }
    requestAnimationFrame(() => map.invalidateSize());
  }, [lat, lon, zoom, cityId]);

  const rootClass =
    className ??
    "z-0 h-full min-h-[220px] w-full rounded-2xl border border-border-soft bg-card shadow-[var(--shadow-card)] sm:min-h-[280px] lg:min-h-[420px]";

  return (
    <div
      ref={containerRef}
      className={rootClass}
      role="application"
      aria-label="Карта выбора адреса доставки"
    />
  );
}
