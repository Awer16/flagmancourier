"use client";

import { filterCitiesByQuery, RUSSIAN_CITIES } from "@/lib/russian-cities";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface CityPickerModalProps {
  open: boolean;
  onClose: () => void;
  currentCityId: string;
  onSelectCity: (cityId: string) => void;
}

export default function CityPickerModal({
  open,
  onClose,
  currentCityId,
  onSelectCity,
}: CityPickerModalProps): React.ReactElement | null {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterCitiesByQuery(query, RUSSIAN_CITIES),
    [query],
  );

  const handlePick = useCallback(
    (cityId: string) => {
      onSelectCity(cityId);
      setQuery("");
      onClose();
    },
    [onClose, onSelectCity],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс строки поиска при открытии модалки
    setQuery("");
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="city-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 transition-opacity"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(88dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-card shadow-[var(--shadow-card-hover)] sm:max-h-[min(80dvh,640px)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 sm:px-5">
          <h2
            id="city-picker-title"
            className="font-heading text-lg font-semibold text-foreground"
          >
            Выбор города
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center cursor-pointer justify-center rounded-xl text-muted transition-colors hover:bg-gray-100 hover:text-foreground"
            aria-label="Закрыть"
          >
            <i className="fas fa-xmark text-lg" aria-hidden />
          </button>
        </div>
        <div className="px-4 pb-2 pt-3 sm:px-5">
          <div className="relative">
            <i
              className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted"
              aria-hidden
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Начните вводить название…"
              autoComplete="off"
              className="w-full rounded-xl border border-border-soft bg-background py-2.5 pl-10 pr-3 text-base text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <ul
          className="min-h-0 flex-1 list-none overflow-y-auto px-2 pb-[env(safe-area-inset-bottom)] sm:px-3"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted">
              Ничего не найдено
            </li>
          ) : (
            filtered.map((city) => {
              const active = city.id === currentCityId;
              return (
                <li key={city.id} className="px-2 pb-1">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => handlePick(city.id)}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-left text-base transition-colors ${
                      active
                        ? "bg-primary/15 font-medium text-foreground"
                        : "text-foreground hover:bg-border-soft/40"
                    }`}
                  >
                    <span>{city.name}</span>
                    {active ? (
                      <i
                        className="fas fa-check text-primary"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <p className="border-t border-border-soft px-4 py-2 text-center text-xs text-muted sm:px-5">
          {filtered.length} из {RUSSIAN_CITIES.length} городов
        </p>
      </div>
    </div>
  );
}
