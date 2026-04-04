"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useCustomerAddress } from "@/components/customer/customer-address-provider";
import CompanyCard from "@/components/customer/company-card";
import { useDeliverySheetSnap } from "@/components/customer/use-delivery-sheet-snap";
import { getCityById } from "@/lib/cities";
import { MOCK_COMPANIES } from "@/lib/mock-companies";

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

export default function CustomerHome(): React.ReactElement {
  const { location, cityId, setCoords, setLabel } = useCustomerAddress();
  const city = getCityById(cityId);
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
  } = useDeliverySheetSnap();

  const onLocationChange = useCallback(
    (nextLat: number, nextLon: number) => {
      setCoords(nextLat, nextLon);
    },
    [setCoords],
  );

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
          <div
            aria-hidden={contentHidden}
            className={`flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 sm:gap-4 sm:px-5 ${
              contentHidden ? "pointer-events-none opacity-0" : "opacity-100"
            }`}
          >
            <div className="shrink-0">
              <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
                Куда доставить?
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                Нажмите на карту или уточните адрес
              </p>
            </div>
            <label className="flex shrink-0 flex-col gap-1.5 text-sm font-medium text-foreground">
              Адрес
              <input
                type="text"
                value={location.label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Подъезд, домофон, этаж"
                className="rounded-xl border border-border-soft bg-white px-3 py-2 text-base font-normal text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <p className="shrink-0 text-[11px] text-muted sm:text-xs">
              {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto border-t border-border-soft pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
              <h2 className="font-heading text-base font-semibold text-foreground sm:text-lg">
                Заведения рядом
              </h2>
              <ul className="mt-2 flex flex-col gap-2 sm:mt-3 sm:gap-3">
                {MOCK_COMPANIES.map((company) => (
                  <li key={company.id}>
                    <CompanyCard company={company} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
