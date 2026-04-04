"use client";

import AddressAutocompleteField from "@/components/address/address-autocomplete-field";
import { useCustomerAddress } from "@/components/customer/customer-address-provider";
import { useSession } from "@/components/session/session-context";
import { DEFAULT_CITY_ID, getCityById } from "@/lib/cities";
import {
  filterCitiesByQuery,
  RUSSIAN_CITIES,
} from "@/lib/russian-cities";
import {
  formatRuPhoneDisplay,
  normalizePhoneDigits,
} from "@/lib/phone-format";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function ProfileModal(): React.ReactElement | null {
  const {
    profileOpen,
    closeProfile,
    phoneDigits,
    saveSessionPhone,
    logout,
  } = useSession();
  const { location, cityId, setLabel, setCoords, setCityId } =
    useCustomerAddress();

  const [phoneDraft, setPhoneDraft] = useState("");
  const [profileCityId, setProfileCityId] = useState(cityId);
  const [citySearch, setCitySearch] = useState("");
  const [addressDraft, setAddressDraft] = useState("");
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [cityListOpen, setCityListOpen] = useState(false);

  const profileCity =
    getCityById(profileCityId) ?? getCityById(DEFAULT_CITY_ID);
  const filteredCities = useMemo(
    () => filterCitiesByQuery(citySearch, RUSSIAN_CITIES),
    [citySearch],
  );

  useEffect(() => {
    if (!profileOpen) {
      return;
    }
    setPhoneDraft(formatRuPhoneDisplay(phoneDigits));
    setProfileCityId(cityId);
    setCitySearch("");
    setAddressDraft(location.label);
    setPicked(null);
    setCityListOpen(false);
  }, [profileOpen, phoneDigits, cityId, location.label]);

  const onSelectCity = useCallback((id: string) => {
    setProfileCityId(id);
    setCitySearch("");
    setAddressDraft("");
    setPicked(null);
    setCityListOpen(false);
  }, []);

  const onPhoneChange = useCallback((raw: string) => {
    setPhoneDraft(formatRuPhoneDisplay(normalizePhoneDigits(raw)));
  }, []);

  const onSave = useCallback(() => {
    const norm = normalizePhoneDigits(phoneDraft);
    saveSessionPhone(norm);
    const addr = addressDraft.trim();
    if (addr) {
      setLabel(addr);
    }
    if (picked) {
      setCoords(picked.lat, picked.lon);
      setCityId(profileCityId, { preserveCoords: true });
    } else if (profileCityId !== cityId) {
      setCityId(profileCityId, { preserveCoords: false });
    }
    closeProfile();
  }, [
    phoneDraft,
    addressDraft,
    picked,
    profileCityId,
    cityId,
    saveSessionPhone,
    setLabel,
    setCoords,
    setCityId,
    closeProfile,
  ]);

  if (!profileOpen) {
    return null;
  }

  const fieldClass =
    "w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 transition-opacity"
        aria-label="Закрыть"
        onClick={closeProfile}
      />
      <div className="relative flex max-h-[min(92dvh,760px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-card shadow-[var(--shadow-card-hover)] sm:max-h-[min(85dvh,680px)] sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3 sm:px-5">
          <h2
            id="profile-modal-title"
            className="font-heading text-lg font-bold text-foreground sm:text-xl"
          >
            Профиль
          </h2>
          <button
            type="button"
            onClick={closeProfile}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-border-soft/50 hover:text-foreground"
            aria-label="Закрыть"
          >
            <i className="fas fa-xmark text-lg" aria-hidden />
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-phone" className="text-sm font-medium text-foreground">
              Телефон
            </label>
            <input
              id="profile-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phoneDraft}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className={fieldClass}
            />
            <p className="text-xs text-muted">
              Номер в формате России: начинается с +7
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground" id="profile-city-label">
              Город доставки
            </span>
            <button
              type="button"
              aria-expanded={cityListOpen}
              aria-controls="profile-city-panel"
              aria-labelledby="profile-city-label"
              onClick={() => setCityListOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border-soft bg-border-soft/15 px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/40"
            >
              <span className="flex min-w-0 items-center gap-2">
                <i className="fas fa-city shrink-0 text-muted" aria-hidden />
                <span className="truncate font-medium">
                  {profileCity?.name ?? "—"}
                </span>
              </span>
              <i
                className={`fas shrink-0 text-muted ${cityListOpen ? "fa-chevron-up" : "fa-chevron-down"}`}
                aria-hidden
              />
            </button>
            {cityListOpen ? (
              <div
                id="profile-city-panel"
                className="flex flex-col gap-2 rounded-xl border border-border-soft bg-card p-2 shadow-[var(--shadow-card)]"
              >
                <label htmlFor="profile-city-search" className="sr-only">
                  Поиск города
                </label>
                <div className="relative">
                  <i
                    className="fas fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted"
                    aria-hidden
                  />
                  <input
                    id="profile-city-search"
                    type="search"
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder="Начните вводить название города…"
                    autoComplete="off"
                    className={`${fieldClass} pl-10`}
                  />
                </div>
                <ul
                  className="max-h-40 overflow-y-auto rounded-lg border border-border-soft/80 py-1"
                  role="listbox"
                  aria-label="Список городов"
                >
                  {filteredCities.slice(0, 50).map((c) => {
                    const selected = c.id === profileCityId;
                    return (
                      <li key={c.id} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => onSelectCity(c.id)}
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
              Сначала выберите город — подсказки адреса станут точнее и быстрее
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="profile-address" className="text-sm font-medium text-foreground">
              Адрес доставки
            </label>
            <AddressAutocompleteField
              id="profile-address"
              value={addressDraft}
              onChange={setAddressDraft}
              onPick={(s) => {
                setAddressDraft(s.label);
                setPicked({ lat: s.lat, lon: s.lon });
              }}
              structuredCity={profileCity?.name}
              placeholder="Улица, дом, квартира…"
              className={fieldClass}
            />
            <p className="text-xs text-muted">
              Поиск улицы и дома в выбранном городе (OpenStreetMap)
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={logout}
              className="order-2 inline-flex items-center justify-center gap-2 rounded-xl border border-border-soft bg-card px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-foreground sm:order-1 sm:mr-auto"
            >
              <i className="fas fa-arrow-right-from-bracket text-xs" aria-hidden />
              Выйти
            </button>
            <button
              type="button"
              onClick={onSave}
              className="order-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-foreground shadow-[var(--shadow-card)] transition-opacity hover:opacity-90 sm:order-2"
            >
              <i className="fas fa-check text-xs" aria-hidden />
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
