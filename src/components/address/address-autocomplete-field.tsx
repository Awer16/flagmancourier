"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

export interface AddressSuggestion {
  label: string;
  lat: number;
  lon: number;
}

interface AddressAutocompleteFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (payload: AddressSuggestion) => void;
  /** Свободный поиск: подсказка в начало строки q (без отдельного города в API) */
  cityNameHint?: string;
  /** Узкий поиск: параметры street + city в Nominatim (быстрее и точнее) */
  structuredCity?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DEBOUNCE_STRUCTURED_MS = 240;
const DEBOUNCE_FREE_MS = 320;

export default function AddressAutocompleteField({
  id: propId,
  value,
  onChange,
  onPick,
  cityNameHint,
  structuredCity,
  placeholder,
  className,
  disabled,
}: AddressAutocompleteFieldProps): React.ReactElement {
  const genId = useId();
  const inputId = propId ?? `addr-${genId}`;
  const listId = `${inputId}-suggestions`;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AddressSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scopedCity = structuredCity?.trim() ?? "";

  const buildFreeQuery = useCallback(
    (v: string): string => {
      const t = v.trim();
      if (!t) {
        return "";
      }
      return cityNameHint ? `${cityNameHint}, ${t}` : t;
    },
    [cityNameHint],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const trimmed = value.trim();
    const useStructured = scopedCity.length > 0;
    const minLen = useStructured ? 2 : 3;
    if (trimmed.length < minLen) {
      setItems([]);
      setLoading(false);
      return;
    }
    const delay = useStructured ? DEBOUNCE_STRUCTURED_MS : DEBOUNCE_FREE_MS;
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void (async (): Promise<void> => {
        try {
          let url: string;
          if (useStructured) {
            url = `/api/address-suggest?q=${encodeURIComponent(trimmed)}&city=${encodeURIComponent(scopedCity)}`;
          } else {
            const q = buildFreeQuery(trimmed);
            url = `/api/address-suggest?q=${encodeURIComponent(q)}`;
          }
          const res = await fetch(url);
          const data = (await res.json()) as AddressSuggestion[];
          setItems(Array.isArray(data) ? data : []);
        } catch {
          setItems([]);
        } finally {
          setLoading(false);
        }
      })();
    }, delay);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, scopedCity, buildFreeQuery]);

  const closeList = useCallback((): void => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const selectItem = useCallback(
    (s: AddressSuggestion): void => {
      onPick(s);
      onChange(s.label);
      closeList();
    },
    [onPick, onChange, closeList],
  );

  return (
    <div className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
          }
          if (items.length > 0) {
            setOpen(true);
          }
        }}
        onBlur={() => {
          blurTimerRef.current = setTimeout(() => closeList(), 180);
        }}
        onKeyDown={(e) => {
          if (!open || items.length === 0) {
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % items.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
          } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            const s = items[activeIndex];
            if (s) {
              selectItem(s);
            }
          } else if (e.key === "Escape") {
            closeList();
          }
        }}
        placeholder={placeholder}
        className={className}
      />
      {loading ? (
        <p className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
          …
        </p>
      ) : null}
      {open && items.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-xl border border-border-soft bg-card py-1 shadow-[var(--shadow-card-hover)]"
        >
          {items.map((s, idx) => (
            <li key={`${s.lat},${s.lon},${idx}`} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={idx === activeIndex}
                className={`flex w-full px-3 py-2 text-left text-sm leading-snug transition-colors ${
                  idx === activeIndex
                    ? "bg-border-soft/60 text-foreground"
                    : "text-foreground hover:bg-border-soft/40"
                }`}
                onMouseDown={(ev) => ev.preventDefault()}
                onClick={() => selectItem(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
