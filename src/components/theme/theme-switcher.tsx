"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemePreference } from "@/components/theme/theme-context";

const OPTIONS: { value: ThemePreference; label: string; icon: string }[] = [
  { value: "system", label: "Как в системе", icon: "fa-desktop" },
  { value: "dark", label: "Тёмная тема", icon: "fa-moon" },
  { value: "light", label: "Светлая тема", icon: "fa-sun" },
];

function iconForPreference(theme: ThemePreference): string {
  const found = OPTIONS.find((o) => o.value === theme);
  return found?.icon ?? "fa-desktop";
}

export default function ThemeSwitcher(): React.ReactElement {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentIcon = iconForPreference(theme);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Тема оформления"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:text-foreground sm:h-10 sm:w-10"
      >
        <i className={`fas ${currentIcon} text-sm sm:text-base`} aria-hidden />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label="Выбор темы"
          className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-xl border border-border-soft bg-card py-1 shadow-[var(--shadow-card-hover)]"
        >
          {OPTIONS.map((opt) => {
            const selected = theme === opt.value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                    selected
                      ? "bg-border-soft/60 text-foreground"
                      : "text-foreground hover:bg-border-soft/40"
                  }`}
                >
                  <i className={`fas ${opt.icon} w-4 text-center text-muted`} aria-hidden />
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
