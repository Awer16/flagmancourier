"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import type { MenuItem } from "@/shared/types/customer";

interface CompanyMenuShopProps {
  menu: MenuItem[];
}

function formatRub(n: number): string {
  return `${n.toLocaleString("ru-RU")} ₽`;
}

function groupByCategory(items: MenuItem[]): Map<string, MenuItem[]> {
  const map = new Map<string, MenuItem[]>();
  for (const item of items) {
    const list = map.get(item.category) ?? [];
    list.push(item);
    map.set(item.category, list);
  }
  return map;
}

function isPromoItem(item: MenuItem): boolean {
  return (
    item.oldPrice != null &&
    item.oldPrice > item.price
  );
}

function discountPercent(item: MenuItem): number {
  if (item.oldPrice == null || item.oldPrice <= item.price) {
    return 0;
  }
  return Math.round((1 - item.price / item.oldPrice) * 100);
}

export default function CompanyMenuShop({
  menu,
}: CompanyMenuShopProps): React.ReactElement {
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const promoItems = useMemo(
    () => menu.filter(isPromoItem),
    [menu],
  );

  const grouped = useMemo(() => groupByCategory(menu), [menu]);

  const categories = useMemo(
    () => [...grouped.keys()].sort((a, b) => a.localeCompare(b, "ru")),
    [grouped],
  );

  const addOne = useCallback((id: string) => {
    setQtyById((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  }, []);

  const removeOne = useCallback((id: string) => {
    setQtyById((prev) => {
      const next = { ...prev };
      const q = (next[id] ?? 0) - 1;
      if (q <= 0) {
        delete next[id];
      } else {
        next[id] = q;
      }
      return next;
    });
  }, []);

  const { totalQty, totalSum } = useMemo(() => {
    let q = 0;
    let sum = 0;
    for (const item of menu) {
      const n = qtyById[item.id] ?? 0;
      if (n > 0) {
        q += n;
        sum += n * item.price;
      }
    }
    return { totalQty: q, totalSum: sum };
  }, [menu, qtyById]);

  const renderCard = (item: MenuItem): React.ReactElement => {
    const qty = qtyById[item.id] ?? 0;
    const pct = discountPercent(item);
    return (
      <article
        key={item.id}
        className="flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-card shadow-[var(--shadow-card)]"
      >
        <div className="relative aspect-[4/3] w-full bg-border-soft/40">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl text-muted">
              <i className="fas fa-bag-shopping" aria-hidden />
            </div>
          )}
          {pct > 0 ? (
            <span className="absolute left-2 top-2 rounded-lg bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              −{pct}%
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3 sm:p-4">
          <h3 className="font-medium leading-snug text-foreground">
            {item.name}
          </h3>
          {item.description ? (
            <p className="text-sm text-muted">{item.description}</p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
            <div className="flex flex-col gap-0.5">
              {item.oldPrice != null && item.oldPrice > item.price ? (
                <span className="text-sm text-muted line-through">
                  {formatRub(item.oldPrice)}
                </span>
              ) : null}
              <span className="text-lg font-semibold text-primary">
                {formatRub(item.price)}
              </span>
            </div>
            <div className="flex items-center gap-0 rounded-xl border border-border-soft bg-background p-0.5">
              <button
                type="button"
                aria-label="Уменьшить количество"
                disabled={qty === 0}
                onClick={() => removeOne(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-border-soft disabled:pointer-events-none disabled:opacity-40"
              >
                <i className="fas fa-minus text-xs" aria-hidden />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums text-foreground">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Увеличить количество"
                onClick={() => addOne(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-opacity hover:opacity-90"
              >
                <i className="fas fa-plus text-xs" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  const renderPromoSlide = (item: MenuItem): React.ReactElement => {
    const pct = discountPercent(item);
    return (
      <div
        key={`promo-${item.id}`}
        className="w-[min(100%,280px)] shrink-0 snap-start"
      >
        <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-[var(--shadow-card)]">
          <div className="relative aspect-[16/10] w-full bg-border-soft/40">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover"
                sizes="280px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-primary">
                <i className="fas fa-tags" aria-hidden />
              </div>
            )}
            <span className="absolute right-2 top-2 rounded-lg bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
              −{pct}%
            </span>
          </div>
          <div className="space-y-2 p-3">
            <p className="font-medium leading-snug text-foreground">
              {item.name}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs text-muted line-through">
                  {item.oldPrice != null ? formatRub(item.oldPrice) : ""}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {formatRub(item.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => addOne(item.id)}
                className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                В корзину
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative pb-24">
      {promoItems.length > 0 ? (
        <section className="mb-8" aria-labelledby="promo-heading">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2
              id="promo-heading"
              className="font-heading text-lg font-semibold text-foreground"
            >
              <i className="fas fa-percent mr-2 text-primary" aria-hidden />
              Скидки и акции
            </h2>
          </div>
          <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:thin] sm:gap-4">
            {promoItems.map(renderPromoSlide)}
          </div>
        </section>
      ) : null}

      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <section key={category} aria-labelledby={`cat-${category}`}>
            <h2
              id={`cat-${category}`}
              className="font-heading text-lg font-semibold text-foreground"
            >
              {category}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(grouped.get(category) ?? []).map((item) => renderCard(item))}
            </div>
          </section>
        ))}
      </div>

      {totalQty > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-soft bg-card/95 px-4 py-3 shadow-[0_-4px_24px_rgb(0_0_0/0.08)] backdrop-blur-sm sm:px-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">В корзине</p>
              <p className="font-semibold text-foreground">
                {totalQty} шт. · {formatRub(totalSum)}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Оформить
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
