"use client";

import Link from "next/link";
import { useState } from "react";
import CityPickerModal from "@/components/customer/city-picker-modal";
import { useCustomerAddress } from "@/components/customer/customer-address-provider";
import { getCityById } from "@/lib/cities";

export default function CustomerHeader(): React.ReactElement {
  const { cityId, setCityId } = useCustomerAddress();
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const currentCity = getCityById(cityId);

  return (
    <>
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-border-soft bg-card/95 shadow-[var(--shadow-card)] backdrop-blur-sm">
        <div className="flex h-14 items-center gap-3 px-4 sm:gap-4">
          <Link
            href="/customer"
            className="shrink-0 font-heading text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg"
          >
            Courier.Here
          </Link>
          <span
            className="h-5 w-px shrink-0 bg-border-soft"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => setCityModalOpen(true)}
            className="min-w-0 max-w-[min(100%,16rem)] shrink-0 truncate text-left text-sm font-normal text-gray-500 underline-offset-2 transition-colors hover:text-gray-700 hover:underline sm:max-w-md sm:text-base"
          >
            {currentCity?.name ?? "Выберите город"}
          </button>
        </div>
      </header>
      <CityPickerModal
        open={cityModalOpen}
        onClose={() => setCityModalOpen(false)}
        currentCityId={cityId}
        onSelectCity={setCityId}
      />
    </>
  );
}
