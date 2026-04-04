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
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary-hover cursor-pointer"
        >
          <i className="fas fa-xmark text-xs" aria-hidden />
          Сбросить поиск
        </button>
      </div>
      <ul
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
      >
        {results.map((store) => (
          <li key={`${store.categoryId}-${store.id}`} className="min-w-0">
            <Link
              href="/customer"
              className="flex h-full min-h-[4.25rem] w-full items-stretch overflow-hidden rounded-2xl border border-border-soft bg-card shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] sm:min-h-[4.75rem]"
            >
              <div className="relative w-[6rem] shrink-0 self-stretch bg-border-soft/50 sm:w-[7rem]">
                <Image
                  src={store.imageUrl}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 20vw, (max-width: 1024px) 25vw, 120px"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2.5 pl-3 pr-2.5 sm:py-3 sm:pr-3">
                <p className="line-clamp-1 text-[11px] font-medium text-primary sm:text-xs">
                  {store.categoryTitle}
                </p>
                <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  {store.name}
                </h3>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted sm:text-xs">
                  <span className="inline-flex items-center gap-0.5 font-medium text-foreground/80">
                    <i
                      className="fas fa-star text-[10px] text-amber-400"
                      aria-hidden
                    />
                    {store.rating.toFixed(1)}
                  </span>
                  <span className="inline-flex items-center gap-0.5">
                    <i className="fas fa-clock text-[10px]" aria-hidden />
                    {store.deliveryEtaMin} мин
                  </span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
