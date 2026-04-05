"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { customerApi } from "@/lib/api-client";

interface OrderTrackingProps {
  params: Promise<{ orderId: string }>;
}

const STATUS_STEPS = [
  { key: "searching_courier", label: "Ищем курьера", icon: "fa-search", desc: "Отправляем запрос ближайшим курьерам" },
  { key: "accepted", label: "Курьер найден", icon: "fa-user-check", desc: "Курьер принял ваш заказ" },
  { key: "picked_up", label: "Забрал заказ", icon: "fa-box", desc: "Курьер забрал заказ из ресторана" },
  { key: "in_delivery", label: "В пути", icon: "fa-truck", desc: "Курьер едет к вам" },
  { key: "delivered", label: "Доставлен", icon: "fa-check-circle", desc: "Приятного аппетита!" },
];

export default function OrderTrackingPage({ params }: OrderTrackingProps) {
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then(async (p) => {
      setOrderId(p.orderId);
      try {
        const data = await customerApi.getOrder(p.orderId);
        setOrder(data);
      } catch {
        setError("Заказ не найден");
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  // Poll for updates every 3 seconds
  useEffect(() => {
    if (!orderId) return;
    const interval = setInterval(async () => {
      try {
        const data = await customerApi.getOrder(orderId);
        setOrder(data);
        if (data.status === "delivered" || data.status === "cancelled") {
          clearInterval(interval);
        }
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const currentStatusIndex = STATUS_STEPS.findIndex(
    (s) => order && s.key === order.status
  );

  const isCancelled = order?.status === "cancelled";
  const isDelivered = order?.status === "delivered";

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-primary" />
          <p className="mt-3 text-muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-3xl text-red-400" />
          <p className="mt-3 text-muted">{error || "Заказ не найден"}</p>
          <Link href="/customer/orders" className="mt-4 inline-block text-primary hover:underline">
            ← Мои заказы
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8 pt-20">
      <div className="mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/customer/orders" className="text-sm text-primary hover:underline">
            <i className="fas fa-arrow-left mr-1" /> Мои заказы
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">
            Заказ #{order.id?.slice(0, 8)}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            {order.eta_minutes && !isDelivered && !isCancelled && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                ~{order.eta_minutes} мин
              </span>
            )}
            {order.distance_km && (
              <span className="text-sm text-muted">
                {order.distance_km} км
              </span>
            )}
          </div>
        </div>

        {/* Status Banner */}
        {isCancelled ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <i className="fas fa-times-circle text-4xl text-red-400 mb-3 block" />
            <p className="text-lg font-semibold text-red-400">Заказ отменён</p>
          </div>
        ) : isDelivered ? (
          <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center">
            <i className="fas fa-check-circle text-4xl text-green-500 mb-3 block" />
            <p className="text-lg font-semibold text-green-500">Заказ доставлен!</p>
            <p className="mt-1 text-sm text-green-400">Приятного аппетита!</p>
          </div>
        ) : (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/40" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <i className={`fas ${STATUS_STEPS[currentStatusIndex]?.icon || "fa-spinner"} text-lg`} />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {STATUS_STEPS[currentStatusIndex]?.label || "Обработка..."}
                </p>
                <p className="text-sm text-muted">
                  {STATUS_STEPS[currentStatusIndex]?.desc || ""}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-6 rounded-2xl border border-border-soft bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 font-heading text-sm font-semibold text-foreground">Прогресс доставки</h2>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, index) => {
              if (isCancelled) return null;

              const isActive = order.status === step.key;
              const isDone = currentStatusIndex >= 0 && index < currentStatusIndex;
              const isFuture = currentStatusIndex >= 0 && index > currentStatusIndex;

              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : isDone
                          ? "bg-green-500 text-white"
                          : "border border-border-soft text-muted"
                      }`}
                    >
                      <i className={`fas ${step.icon}`} />
                    </div>
                    {index < STATUS_STEPS.length - 1 && (
                      <div className={`h-8 w-0.5 transition-colors ${isDone ? "bg-green-500" : "bg-border-soft"}`} />
                    )}
                  </div>

                  <div className="flex-1 pb-6">
                    <p
                      className={`text-sm font-medium transition-colors ${
                        isActive ? "text-primary" : isDone ? "text-green-500" : isFuture ? "text-muted/50" : "text-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isActive && !isDelivered && !isCancelled && (
                      <p className="mt-0.5 text-xs text-muted animate-pulse">
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="mb-6 rounded-2xl border border-border-soft bg-card p-6 shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-sm font-semibold text-foreground">Состав заказа</h2>
          {order.items && order.items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {order.items.map((item: any) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted">
                    × {item.quantity} · {item.menu_item_id?.slice(0, 8)}...
                  </span>
                  <span className="font-medium text-foreground">
                    {parseFloat(item.price_at_order) * parseInt(item.quantity)} ₽
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 space-y-2 border-t border-border-soft pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Сумма</span>
              <span className="text-foreground">{order.total_amount} ₽</span>
            </div>
            {order.delivery_fee && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Доставка</span>
                <span className="text-foreground">{order.delivery_fee} ₽</span>
              </div>
            )}
            {order.original_amount && order.original_amount !== order.total_amount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Было</span>
                <span className="text-muted line-through">{order.original_amount} ₽</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <span className="text-foreground">Итого</span>
              <span className="text-primary">{order.total_amount} ₽</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        {order.delivery_address && (
          <div className="rounded-2xl border border-border-soft bg-card p-6 shadow-[var(--shadow-card)]">
            <h2 className="font-heading text-sm font-semibold text-foreground">
              <i className="fas fa-map-marker-alt mr-2 text-primary" /> Адрес доставки
            </h2>
            <p className="mt-2 text-sm text-foreground">{order.delivery_address.address}</p>

            {/* Address details */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {order.delivery_address.entrance && (
                <div className="rounded-lg bg-border-soft/10 p-2 text-center">
                  <p className="text-xs text-muted">Подъезд</p>
                  <p className="text-sm font-semibold text-foreground">{order.delivery_address.entrance}</p>
                </div>
              )}
              {order.delivery_address.floor && (
                <div className="rounded-lg bg-border-soft/10 p-2 text-center">
                  <p className="text-xs text-muted">Этаж</p>
                  <p className="text-sm font-semibold text-foreground">{order.delivery_address.floor}</p>
                </div>
              )}
              {order.delivery_address.apartment && (
                <div className="rounded-lg bg-border-soft/10 p-2 text-center">
                  <p className="text-xs text-muted">Квартира</p>
                  <p className="text-sm font-semibold text-foreground">{order.delivery_address.apartment}</p>
                </div>
              )}
            </div>

            {order.delivery_address.comment && (
              <div className="mt-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-xs text-muted">Комментарий</p>
                <p className="text-sm text-foreground">{order.delivery_address.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
