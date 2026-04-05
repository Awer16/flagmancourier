"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddressAutocompleteField from "@/components/address/address-autocomplete-field";
import type { AddressSuggestion } from "@/components/address/address-autocomplete-field";
import { useCustomerAddress } from "@/components/customer/customer-address-provider";
import { useDeliverySheetSnap } from "@/components/customer/use-delivery-sheet-snap";
import { useSession } from "@/components/session/session-context";
import CompanyCard from "@/components/customer/company-card";
import CustomerDeliveryCityBlock from "@/components/customer/customer-delivery-city-block";
import { getCityById } from "@/lib/cities";
import { findNearestCityId } from "@/lib/geo";
import { getAllNearbyCompanies } from "@/lib/mock-companies";
import { customerApi, publicApi } from "@/lib/api-client";
import { companyToFrontend } from "@/lib/api-adapters";
import type { Company } from "@/shared/types/customer";

const AddressMapPicker = dynamic(
  () => import("@/components/map/address-map-picker"),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 z-0 flex items-center justify-center bg-gray-200 text-sm text-muted">
        <i className="fas fa-map-location-dot mr-2 text-lg text-primary" />
        Загрузка карты…
      </div>
    ),
  },
);

const addressInputClass =
  "w-full rounded-xl border border-border-soft bg-background px-3 py-2 text-base font-normal text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40";

export default function CustomerHome(): React.ReactElement {
  const { isLoggedIn } = useSession();
  const { location, cityId, setCoords, setLabel, setCityId } =
    useCustomerAddress();
  const [addressEditing, setAddressEditing] = useState(false);
  const [guestMapPickActive, setGuestMapPickActive] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const city = getCityById(cityId);

  // Загрузка компаний с бэкенда + fallback на мок-данные
  useEffect(() => {
    setLoadingCompanies(true);
    // Определяем какой город использовать для фильтра
    const backendCity = city?.name || "Ростов-на-Дону";

    publicApi
      .getCompanies(backendCity)
      .then((backendCompanies) => {
        if (backendCompanies.length > 0) {
          const enriched = backendCompanies.map((bc) => {
            return companyToFrontend(bc, []);
          });
          setCompanies(enriched);
        } else {
          // Backend вернул пустой массив — используем мок-данные
          const mock = getAllNearbyCompanies(location.lat, location.lon, cityId);
          setCompanies(mock);
        }
      })
      .catch((err) => {
        console.warn("Backend недоступен, используем мок-данные:", err);
        const mock = getAllNearbyCompanies(location.lat, location.lon, cityId);
        setCompanies(mock);
      })
      .finally(() => setLoadingCompanies(false));
  }, [cityId, location.lat, location.lon]);

  const {
    snap,
    dragging,
    sheetHeightPx,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    onHandleClick,
    contentHidden,
    collapseToPeek,
    snapTo,
  } = useDeliverySheetSnap();

  const addressEditingRef = useRef(addressEditing);
  const guestMapPickRef = useRef(guestMapPickActive);
  useEffect(() => {
    addressEditingRef.current = addressEditing;
  }, [addressEditing]);
  useEffect(() => {
    guestMapPickRef.current = guestMapPickActive;
  }, [guestMapPickActive]);

  const hasLabel = location.label.trim().length > 0;
  const showAddressCompact = isLoggedIn && hasLabel && !addressEditing;
  const showCityBeforeAddress = !isLoggedIn || !hasLabel;

  useEffect(() => {
    if (!showCityBeforeAddress) {
      setGuestMapPickActive(false);
    }
  }, [showCityBeforeAddress]);

  const onAddressLabelChange = useCallback(
    (v: string) => {
      setLabel(v);
      setGuestMapPickActive(false);
    },
    [setLabel],
  );

  const onAddressPick = useCallback(
    (s: AddressSuggestion) => {
      setLabel(s.label);
      setCoords(s.lat, s.lon);
      setCityId(findNearestCityId(s.lat, s.lon), { preserveCoords: true });
      setGuestMapPickActive(false);
      if (isLoggedIn) {
        setAddressEditing(false);
      }
    },
    [setLabel, setCoords, setCityId, isLoggedIn],
  );

  const onLocationChange = useCallback(
    (nextLat: number, nextLon: number) => {
      setCoords(nextLat, nextLon);
    },
    [setCoords],
  );

  const onMapPickFromSheet = useCallback(
    async (nextLat: number, nextLon: number) => {
      if (!addressEditingRef.current && !guestMapPickRef.current) {
        return;
      }
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${encodeURIComponent(nextLat)}&lon=${encodeURIComponent(nextLon)}`,
        );
        const data = (await res.json()) as { label: string | null };
        const text =
          typeof data.label === "string" && data.label.trim().length > 0
            ? data.label.trim()
            : `Точка на карте, ${nextLat.toFixed(5)}, ${nextLon.toFixed(5)}`;
        setLabel(text);
        setCityId(findNearestCityId(nextLat, nextLon), {
          preserveCoords: true,
        });
      } catch {
        setLabel(`Точка на карте, ${nextLat.toFixed(5)}, ${nextLon.toFixed(5)}`);
        setCityId(findNearestCityId(nextLat, nextLon), {
          preserveCoords: true,
        });
      }
      setAddressEditing(false);
      setGuestMapPickActive(false);
      collapseToPeek();
    },
    [setLabel, setCityId, collapseToPeek],
  );

  const mapPickMode = addressEditing || guestMapPickActive;

  // Объединяем компании с мок-данными если бэкенд недоступен
  const displayCompanies = useMemo(() => {
    if (companies.length > 0) return companies;
    // ALWAYS fallback to mock if backend returned empty
    return getAllNearbyCompanies(location.lat, location.lon, cityId);
  }, [companies, location.lat, location.lon, cityId]);

  const mapZoom = city?.zoom ?? 12;

  const snapLabel =
    snap === 0 ? "свернута" : snap === 1 ? "наполовину экрана" : "на весь экран";

  return (
    <>
      <div className="fixed inset-0 z-0">
        <div className="absolute left-0 right-0 top-14 bottom-0">
          <AddressMapPicker
            lat={location.lat}
            lon={location.lon}
            zoom={mapZoom}
            cityId={cityId}
            onLocationChange={onLocationChange}
            onMapClick={mapPickMode ? onMapPickFromSheet : undefined}
            className="absolute inset-0 z-0 h-full w-full min-h-0 rounded-none border-0 bg-gray-200 shadow-none"
          />
        </div>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20">
        <div
          className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border-soft bg-card/98 shadow-[0_-6px_24px_rgb(0_0_0_/_0.1)] backdrop-blur-sm"
          style={{
            height: sheetHeightPx,
            transition: dragging
              ? "none"
              : "height 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          <button
            type="button"
            aria-expanded={!contentHidden}
            aria-label={`Панель доставки, ${snapLabel}. Потяните или нажмите для смены высоты.`}
            onClick={onHandleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            className="flex w-full shrink-0 cursor-grab touch-none flex-col items-center border-b border-transparent pt-2.5 pb-2 outline-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <span
              className="block h-1 w-10 rounded-full bg-gray-400"
              aria-hidden
            />
            <span className="sr-only">
              Три режима: полоска внизу, половина экрана, почти на весь
              экран. Потяните вверх или вниз, либо нажмите для переключения по
              кругу.
            </span>
          </button>
          <div className="shrink-0 px-4 pb-2 pt-0.5 sm:px-5">
            <p
              className={`text-center text-xs leading-snug line-clamp-3 ${
                mapPickMode ? "font-medium text-primary" : "text-muted"
              }`}
            >
              {mapPickMode ? (
                <>
                  <i className="fas fa-map-location-dot mr-1" aria-hidden />
                  {guestMapPickActive
                    ? "Нажмите на карте точку доставки — адрес подставится в поле"
                    : "Нажмите на карте или потяните панель вверх для ввода адреса"}
                </>
              ) : hasLabel ? (
                <>
                  <i
                    className="fas fa-location-dot mr-1 text-primary"
                    aria-hidden
                  />
                  <span className="text-foreground/90">{location.label}</span>
                </>
              ) : showCityBeforeAddress ? (
                "Сначала выберите город слева, затем адрес или точку на карте"
              ) : (
                "Укажите адрес в панели или выберите точку на карте"
              )}
            </p>
          </div>
          <div
            aria-hidden={contentHidden}
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 sm:gap-4 sm:px-5"
          >
            <div className="shrink-0">
              <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Куда доставить?
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {guestMapPickActive
                  ? "Коснитесь карты в нужном месте — адрес заполнится автоматически"
                  : showCityBeforeAddress && !addressEditing
                    ? "Выберите город, затем улицу и дом — или точку на карте"
                    : "Нажмите на карту или уточните адрес"}
              </p>
            </div>
            {showAddressCompact ? (
              <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-border-soft bg-border-soft/15 p-3 sm:p-4">
                <p className="text-sm font-medium text-foreground">
                  Адрес доставки
                </p>
                <p className="text-sm leading-snug text-foreground/90">
                  {location.label}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAddressEditing(true);
                    setGuestMapPickActive(false);
                    snapTo(0);
                  }}
                  className="inline-flex w-fit items-center gap-2 rounded-xl border border-border-soft bg-card px-3 py-2 text-sm font-medium text-primary transition-colors hover:border-primary"
                >
                  <i className="fas fa-pen text-xs" aria-hidden />
                  Изменить адрес
                </button>
              </div>
            ) : (
              <div
                className={`flex shrink-0 flex-col gap-3 ${
                  showCityBeforeAddress && !addressEditing
                    ? "sm:flex-row sm:items-start sm:gap-5"
                    : ""
                }`}
              >
                {showCityBeforeAddress && !addressEditing ? (
                  <div className="w-full shrink-0 sm:max-w-[13.5rem] sm:border-r sm:border-border-soft sm:pr-5">
                    <CustomerDeliveryCityBlock
                      cityId={cityId}
                      onSelectCity={setCityId}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 flex flex-col gap-2">
                  {addressEditing ? (
                    <p className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs leading-snug text-foreground sm:text-sm">
                      <i
                        className="fas fa-map-location-dot mt-0.5 shrink-0 text-primary"
                        aria-hidden
                      />
                      Нажмите на карте точку доставки — адрес подставится в
                      поле, панель свернётся вниз. Можно также ввести адрес ниже.
                    </p>
                  ) : null}
                  <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
                    Адрес
                    <AddressAutocompleteField
                      value={location.label}
                      onChange={onAddressLabelChange}
                      onPick={onAddressPick}
                      structuredCity={city?.name}
                      placeholder="Улица, дом, подъезд…"
                      className={addressInputClass}
                    />
                  </label>
                  {showCityBeforeAddress && !addressEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setGuestMapPickActive(true);
                        collapseToPeek();
                      }}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-card px-3 py-2.5 text-sm font-medium text-primary shadow-[var(--shadow-card)] transition-colors hover:border-primary sm:w-auto sm:self-start"
                    >
                      <i
                        className="fas fa-map-location-dot text-base"
                        aria-hidden
                      />
                      Выбрать адрес на карте
                    </button>
                  ) : null}
                </div>
              </div>
            )}
            <p className="shrink-0 text-[11px] text-muted sm:text-xs">
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-border-soft pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <h2 className="font-heading text-base font-semibold text-foreground sm:text-lg">
                Заведения рядом
              </h2>
              {loadingCompanies ? (
                <div className="flex items-center justify-center py-8">
                  <i className="fas fa-spinner fa-spin text-2xl text-primary" />
                </div>
              ) : displayCompanies.length === 0 ? (
                <p className="mt-3 text-sm text-muted">
                  В выбранном городе и радиусе доставки заведений не найдено.
                  Смените город или укажите точку на карте ближе к центру.
                </p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2 sm:mt-3 sm:gap-3">
                  {displayCompanies.map((company) => (
                    <li key={company.id}>
                      <CompanyCard company={company} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
