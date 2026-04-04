"use client";

import { useCallback, useMemo, useState } from "react";
import { getCityById } from "@/lib/cities";
import {
  filterCitiesByQuery,
  RUSSIAN_CITIES,
} from "@/lib/russian-cities";

interface CustomerDeliveryCityBlockProps {
  cityId: string;
  onSelectCity: (id: string) => void;
}

export default function CustomerDeliveryCityBlock({
  cityId,
  onSelectCity,
}: CustomerDeliveryCityBlockProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const city = getCityById(cityId);
  const filtered = useMemo(
    () => filterCitiesByQuery(query, RUSSIAN_CITIES),
    [query],
  );

  const pick = useCallback(
    (id: string) => {
      onSelectCity(id);
      setOpen(false);
      setQuery("");
    },
    [onSelectCity],
  );

  const inputClass =
    "w-full rounded-xl border border-border-soft bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground" id="delivery-city-label">
        Город
      </span>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="delivery-city-panel"
        aria-labelledby="delivery-city-label"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border-soft bg-border-soft/15 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40"
      >
        <span className="flex min-w-0 items-center gap-2">
          <i className="fas fa-city shrink-0 text-muted" aria-hidden />
          <span className="truncate font-medium">{city?.name ?? "—"}</span>
        </span>
        <i
          className={`fas shrink-0 text-muted ${open ? "fa-chevron-up" : "fa-chevron-down"}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div
          id="delivery-city-panel"
          className="flex flex-col gap-2 rounded-xl border border-border-soft bg-card p-2 shadow-[var(--shadow-card)]"
        >
          <div className="relative">
            <i
              className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск города…"
              autoComplete="off"
              className={inputClass}
            />
          </div>
          <ul
            className="max-h-36 overflow-y-auto rounded-lg border border-border-soft/80 py-1"
            role="listbox"
            aria-label="Города"
          >
            {filtered.slice(0, 45).map((c) => {
              const selected = c.id === cityId;
              return (
                <li key={c.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => pick(c.id)}
                    className={`flex w-full px-3 py-2 text-left text-sm transition-colors ${
                      selected
                        ? "bg-primary/15 font-medium text-foreground"
                        : "text-foreground hover:bg-border-soft/40"
                    }`}
                  >
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <p className="text-xs text-muted">
        Сначала выберите город — подсказки адреса будут точнее
      </p>
    </div>
  );
}
