"use client";

import Image from "next/image";
import Link from "next/link";
import type { HomeStoreWithCategory } from "@/shared/types/home-marketplace";

interface MarketplaceSearchResultsProps {
  results: HomeStoreWithCategory[];
  query: string;
  onClear: () => void;
}

export default function MarketplaceSearchResults({
  results,
  query,
  onClear,
}: MarketplaceSearchResultsProps): React.ReactElement {
  const trimmed = query.trim();

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-soft bg-card/60 px-4 py-12 text-center sm:px-6">
        <p className="font-heading text-lg font-semibold text-foreground">
          Ничего не нашлось
        </p>
        <p className="mt-2 text-sm text-muted">
          По запросу «{trimmed}» магазинов нет. Попробуйте другое слово или
          сбросьте поиск.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border-soft bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-colors hover:border-primary hover:text-primary"
        >
          <i className="fas fa-arrow-rotate-left text-xs" aria-hidden />
          Показать все категории
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Найдено:{" "}
          <span className="font-medium text-foreground">{results.length}</span>
          {trimmed ? (
            <>
              {" "}
              по «<span className="text-foreground">{trimmed}</span>»
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          <i className="fas fa-xmark text-xs" aria-hidden />
          Сбросить поиск
        </button>
      </div>
      <ul className="flex flex-col gap-2 sm:gap-3" role="list">
        {results.map((store) => (
          <li key={`${store.categoryId}-${store.id}`}>
            <Link
              href="/customer"
              className="flex w-full gap-3 rounded-2xl border border-border-soft bg-card p-3 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:gap-4 sm:p-4"
            >
              <div className="relative h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-border-soft/50 sm:h-24 sm:w-32">
                <Image
                  src={store.imageUrl}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                <p className="text-xs font-medium text-primary">
                  {store.categoryTitle}
                </p>
                <h3 className="truncate text-base font-semibold text-foreground sm:text-lg">
                  {store.name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted sm:text-sm">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                    <i
                      className="fas fa-star text-[11px] text-amber-400"
                      aria-hidden
                    />
                    {store.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <i className="fas fa-clock text-[11px]" aria-hidden />
                    {store.deliveryEtaMin} мин
                  </span>
                </div>
              </div>
              <div className="hidden shrink-0 self-center sm:flex">
                <i
                  className="fas fa-chevron-right text-muted"
                  aria-hidden
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
