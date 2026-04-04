"use client";

import type { DeliveryLocation } from "@/shared/types/customer";
import { DEFAULT_CITY_ID, getCityById } from "@/lib/cities";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "courier-here-delivery";

function defaultLocation(): DeliveryLocation {
  const city = getCityById(DEFAULT_CITY_ID);
  return {
    lat: city?.lat ?? 55.7522,
    lon: city?.lon ?? 37.6156,
    label: "",
  };
}

interface StoredPayload {
  lat: unknown;
  lon: unknown;
  label: unknown;
  cityId?: unknown;
}

interface CustomerAddressContextValue {
  location: DeliveryLocation;
  cityId: string;
  setLocation: (next: DeliveryLocation) => void;
  setCoords: (lat: number, lon: number) => void;
  setLabel: (label: string) => void;
  setCityId: (
    id: string,
    options?: { preserveCoords?: boolean },
  ) => void;
}

const CustomerAddressContext = createContext<
  CustomerAddressContextValue | undefined
>(undefined);

function parseStored(raw: string): {
  location: DeliveryLocation;
  cityId: string;
} | null {
  try {
    const parsed = JSON.parse(raw) as StoredPayload;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.lat !== "number" ||
      typeof parsed.lon !== "number" ||
      typeof parsed.label !== "string"
    ) {
      return null;
    }
    const cityId =
      typeof parsed.cityId === "string" && getCityById(parsed.cityId)
        ? parsed.cityId
        : DEFAULT_CITY_ID;
    return {
      location: {
        lat: parsed.lat,
        lon: parsed.lon,
        label: parsed.label,
      },
      cityId,
    };
  } catch {
    return null;
  }
}

function readStored(): { location: DeliveryLocation; cityId: string } | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return parseStored(raw);
  } catch {
    return null;
  }
}

export function CustomerAddressProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [location, setLocationState] = useState<DeliveryLocation>(
    defaultLocation,
  );
  const [cityId, setCityIdState] = useState<string>(DEFAULT_CITY_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- гидрация из localStorage
      setLocationState(stored.location);
      setCityIdState(stored.cityId);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...location, cityId }),
      );
    } catch {
      /* ignore */
    }
  }, [location, cityId, hydrated]);

  const setLocation = useCallback((next: DeliveryLocation) => {
    setLocationState(next);
  }, []);

  const setCoords = useCallback((lat: number, lon: number) => {
    setLocationState((prev) => ({ ...prev, lat, lon }));
  }, []);

  const setLabel = useCallback((label: string) => {
    setLocationState((prev) => ({ ...prev, label }));
  }, []);

  const setCityId = useCallback(
    (id: string, options?: { preserveCoords?: boolean }) => {
      const city = getCityById(id);
      if (!city) {
        return;
      }
      setCityIdState(id);
      if (options?.preserveCoords) {
        return;
      }
      setLocationState((prev) => ({
        ...prev,
        lat: city.lat,
        lon: city.lon,
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      location,
      cityId,
      setLocation,
      setCoords,
      setLabel,
      setCityId,
    }),
    [location, cityId, setLocation, setCoords, setLabel, setCityId],
  );

  return (
    <CustomerAddressContext.Provider value={value}>
      {children}
    </CustomerAddressContext.Provider>
  );
}

export function useCustomerAddress(): CustomerAddressContextValue {
  const ctx = useContext(CustomerAddressContext);
  if (!ctx) {
    throw new Error("useCustomerAddress вне CustomerAddressProvider");
  }
  return ctx;
}
