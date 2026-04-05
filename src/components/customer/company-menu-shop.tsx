"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/shared/types/customer";
import { customerApi } from "@/lib/api-client";
import { menuItemToFrontend } from "@/lib/api-adapters";
import { useCustomerAddress } from "@/components/customer/customer-address-provider";
import { useSession } from "@/components/session/session-context";

interface CompanyMenuShopProps {
  companyId: string;
  companyName?: string;
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
  return item.oldPrice != null && item.oldPrice > item.price;
}

function discountPercent(item: MenuItem): number {
  if (item.oldPrice == null || item.oldPrice <= item.price) {
    return 0;
  }
  return Math.round((1 - item.price / item.oldPrice) * 100);
}

export default function CompanyMenuShop({
  companyId,
  companyName,
}: CompanyMenuShopProps): React.ReactElement {
  const { location } = useCustomerAddress();
  const { isLoggedIn } = useSession();
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState<{ valid: boolean; discount_percent: string | null; final_amount: string | null; error: string | null } | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  // Address details
  const [aptFloor, setAptFloor] = useState("");
  const [aptEntrance, setAptEntrance] = useState("");
  const [aptApartment, setAptApartment] = useState("");
  const [aptComment, setAptComment] = useState("");

  useEffect(() => {
    setLoading(true);
    customerApi
      .getCompanyMenu(companyId)
      .then((items) => {
        setMenu(items.map(menuItemToFrontend));
      })
      .catch((err) => {
        console.error("Failed to load menu:", err);
        setMenu([]);
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const promoItems = useMemo(() => menu.filter(isPromoItem), [menu]);

  const grouped = useMemo(() => groupByCategory(menu), [menu]);

  const categories = useMemo(
    () => [...grouped.keys()].sort((a, b) => a.localeCompare(b, "ru")),
    [grouped]
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

  const { totalQty, totalSum, cartItems } = useMemo(() => {
    let q = 0;
    let sum = 0;
    const items: { menu_item_id: string; quantity: number }[] = [];
    for (const item of menu) {
      const n = qtyById[item.id] ?? 0;
      if (n > 0) {
        q += n;
        sum += n * item.price;
        items.push({ menu_item_id: item.id, quantity: n });
      }
    }
    return { totalQty: q, totalSum: sum, cartItems: items };
  }, [menu, qtyById]);

  const validatePromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    setValidatingPromo(true);
    try {
      const result = await customerApi.validatePromoCode({
        code: promoCode.trim(),
        company_id: companyId,
        order_amount: String(totalSum),
      });
      setPromoResult(result);
    } catch {
      setPromoResult({ valid: false, discount_percent: null, final_amount: null, error: "Ошибка проверки" });
    }
    setValidatingPromo(false);
  }, [promoCode, companyId, totalSum]);

  const placeOrder = useCallback(async () => {
    if (!isLoggedIn) {
      alert("Войдите в аккаунт для оформления заказа");
      return;
    }
    if (cartItems.length === 0) return;

    setPlacingOrder(true);
    try {
      // Try to use saved address or create one from current location
      let addressId: string | undefined;
      try {
        const addresses = await customerApi.getAddresses();
        addressId = addresses[0]?.id;
      } catch {
        // not authenticated or error
      }

      if (!addressId && location.label) {
        try {
          const addr = await customerApi.createAddress({
            address: location.label,
            latitude: String(location.lat),
            longitude: String(location.lon),
            floor: aptFloor || undefined,
            apartment: aptApartment || undefined,
            comment: aptComment || undefined,
          });
          addressId = addr.id;
        } catch {
          // ignore
        }
      }

      if (!addressId) {
        alert("Укажите адрес доставки");
        setPlacingOrder(false);
        return;
      }

      const currentPromoResult = promoResult;
      const order = await customerApi.createOrder({
        company_id: companyId,
        delivery_address_id: addressId,
        items: cartItems,
        promo_code: currentPromoResult?.valid ? promoCode.trim() : undefined,
      });

      setQtyById({});
      setShowCheckout(false);
      setPromoCode("");
      setPromoResult(null);
      setAptFloor("");
      setAptEntrance("");
      setAptApartment("");
      setAptComment("");

      // Redirect to order tracking
      router.push(`/customer/orders/${order.id}`);
    } catch (err: any) {
      alert("Ошибка при оформлении: " + (err.message || "Неизвестная ошибка"));
    }
    setPlacingOrder(false);
  }, [isLoggedIn, cartItems, companyId, location, promoCode, promoResult]);

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
      <div key={`promo-${item.id}`} className="w-[min(100%,280px)] shrink-0 snap-start">
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
            <p className="font-medium leading-snug text-foreground">{item.name}</p>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="fas fa-spinner fa-spin text-3xl text-primary" />
      </div>
    );
  }

  if (menu.length === 0) {
    return (
      <div className="py-12 text-center text-muted">
        <i className="fas fa-utensils text-4xl mb-3 block" />
        <p>Меню пока пусто</p>
      </div>
    );
  }

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
              onClick={() => setShowCheckout(true)}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Оформить
            </button>
          </div>
        </div>
      ) : null}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-md rounded-t-2xl bg-card p-6 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Оформление заказа</h3>
              <button onClick={() => setShowCheckout(false)} className="text-muted hover:text-foreground">
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {/* Address */}
              <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3">
                <p className="text-sm font-medium text-foreground mb-2">
                  <i className="fas fa-map-marker-alt mr-1 text-primary" /> Адрес доставки
                </p>
                <p className="text-sm text-muted">{location.label || "Не указан"}</p>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-medium text-foreground">Подъезд</label>
                  <input
                    value={aptEntrance}
                    onChange={(e) => setAptEntrance(e.target.value)}
                    placeholder="1"
                    className="w-full rounded-xl border border-border-soft bg-background px-2 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Этаж</label>
                  <input
                    value={aptFloor}
                    onChange={(e) => setAptFloor(e.target.value)}
                    placeholder="5"
                    className="w-full rounded-xl border border-border-soft bg-background px-2 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Квартира</label>
                  <input
                    value={aptApartment}
                    onChange={(e) => setAptApartment(e.target.value)}
                    placeholder="42"
                    className="w-full rounded-xl border border-border-soft bg-background px-2 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Комментарий курьеру</label>
                <input
                  value={aptComment}
                  onChange={(e) => setAptComment(e.target.value)}
                  placeholder="Код домофона, ориентиры..."
                  className="w-full rounded-xl border border-border-soft bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                />
              </div>

              {/* Order items */}
              <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3">
                <p className="text-sm text-muted mb-2">Товары</p>
                {cartItems.map((ci) => {
                  const item = menu.find((m) => m.id === ci.menu_item_id);
                  return item ? (
                    <div key={ci.menu_item_id} className="flex justify-between text-sm text-foreground py-1">
                      <span>{item.name} x{ci.quantity}</span>
                      <span>{formatRub(item.price * ci.quantity)}</span>
                    </div>
                  ) : null;
                })}
              </div>
              <div className="flex items-center justify-between border-t border-border-soft pt-3">
                <span className="font-semibold text-foreground">Итого:</span>
                <span className="text-lg font-bold text-primary">
                  {promoResult?.valid && promoResult.final_amount ? (
                    <>
                      <span className="text-sm text-muted line-through mr-2">{formatRub(totalSum)}</span>
                      {formatRub(parseFloat(promoResult.final_amount))}
                    </>
                  ) : (
                    formatRub(totalSum)
                  )}
                </span>
              </div>
              {/* Promo code */}
              <div className="flex gap-2">
                <input
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoResult(null); }}
                  placeholder="Промокод"
                  className="flex-1 rounded-xl border border-border-soft bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={validatePromo}
                  disabled={validatingPromo || !promoCode.trim()}
                  className="rounded-xl border border-border-soft bg-border-soft/15 px-3 py-2 text-sm text-foreground transition-colors hover:border-primary/50 disabled:opacity-50"
                >
                  {validatingPromo ? <i className="fas fa-spinner fa-spin" /> : "OK"}
                </button>
              </div>
              {promoResult && (
                <p className={`text-sm ${promoResult.valid ? "text-green-500" : "text-red-400"}`}>
                  {promoResult.valid ? (
                    <>✓ Скидка {promoResult.discount_percent}% — {formatRub(parseFloat(promoResult.final_amount!))}</>
                  ) : (
                    <>✗ {promoResult.error}</>
                  )}
                </p>
              )}
            </div>
            <button
              onClick={placeOrder}
              disabled={placingOrder}
              className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {placingOrder ? (
                <><i className="fas fa-spinner fa-spin mr-2" /> Оформляем...</>
              ) : (
                <><i className="fas fa-check mr-2" /> Подтвердить заказ</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
