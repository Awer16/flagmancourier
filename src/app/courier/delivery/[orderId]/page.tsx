"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { courierApi } from "@/lib/api-client";

const AddressMapPicker = dynamic(
  () => import("@/components/map/address-map-picker"),
  { ssr: false }
);

interface DeliveryMapPageProps {
  params: Promise<{ orderId: string }>;
}

export default function CourierDeliveryMapPage({ params }: DeliveryMapPageProps) {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [step, setStep] = useState<"to_restaurant" | "to_customer">("to_restaurant");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(async (p) => {
      setOrderId(p.orderId);
      try {
        const data = await courierApi.getMyOrders();
        const found = data.find((o: any) => o.id === p.orderId);
        if (found) {
          setOrder(found);
          if (found.status === "accepted") {
            setStep("to_restaurant");
          } else if (["picked_up", "in_delivery"].includes(found.status)) {
            setStep("to_customer");
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    });
  }, [params]);

  const currentLat = useMemo(() => {
    if (step === "to_restaurant") {
      return order?.delivery_address ? 47.23 : 47.2357;
    }
    return order?.delivery_address?.latitude ? parseFloat(order.delivery_address.latitude) : 47.2357;
  }, [order, step]);

  const currentLon = useMemo(() => {
    if (step === "to_restaurant") {
      return order?.delivery_address ? 39.70 : 39.7015;
    }
    return order?.delivery_address?.longitude ? parseFloat(order.delivery_address.longitude) : 39.7015;
  }, [order, step]);

  const updateStatus = useCallback(async (status: string) => {
    if (!orderId) return;
    try {
      await courierApi.updateOrderStatus(orderId, status);
      const data = await courierApi.getMyOrders();
      const found = data.find((o: any) => o.id === orderId);
      if (found) {
        setOrder(found);
        if (status === "picked_up") {
          setStep("to_customer");
        } else if (status === "delivered") {
          router.push("/courier");
        }
      }
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось обновить статус"));
    }
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <i className="fas fa-spinner fa-spin text-3xl text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-3xl text-red-400" />
          <p className="mt-3 text-muted">Заказ не найден</p>
          <button onClick={() => router.push("/courier")} className="mt-4 text-primary hover:underline">
            ← Назад
          </button>
        </div>
      </div>
    );
  }

  // Determine current step based on order status
  const showRestaurantRoute = ["accepted", "ready_for_pickup"].includes(order.status);
  const showCustomerRoute = ["picked_up", "in_delivery"].includes(order.status);

  return (
    <div className="relative h-dvh w-full">
      {/* Map */}
      <div className="absolute inset-0 z-0">
        <AddressMapPicker
          lat={currentLat}
          lon={currentLon}
          zoom={14}
          cityId="rostov"
          onLocationChange={() => {}}
          className="h-full w-full"
        />
      </div>

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-10 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <button onClick={() => router.push("/courier")} className="text-muted hover:text-foreground">
            <i className="fas fa-arrow-left mr-1" /> Назад
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {showRestaurantRoute ? "🍽️ Езжайте в ресторан" : "🏠 Доставьте клиенту"}
            </p>
            <p className="text-xs text-muted">
              {showRestaurantRoute ? "Забрать заказ" : "Доставить по адресу"}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Bottom action panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-card/95 p-4 shadow-lg backdrop-blur-sm">
        <div className="mx-auto max-w-lg space-y-3">
          {showRestaurantRoute && (
            <>
              <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3">
                <p className="text-sm font-medium text-foreground">
                  <i className="fas fa-utensils mr-1 text-primary" /> Ресторан
                </p>
                <p className="text-xs text-muted mt-1">{order.company_address || "Адрес ресторана"}</p>
                {order.status === "ready_for_pickup" && (
                  <p className="text-xs text-green-500 mt-1">
                    <i className="fas fa-check mr-1" /> Заказ готов — можно забирать!
                  </p>
                )}
                {order.status === "accepted" && (
                  <p className="text-xs text-yellow-500 mt-1">
                    <i className="fas fa-clock mr-1" /> Ресторан ещё готовит заказ...
                  </p>
                )}
              </div>
              <button
                onClick={() => updateStatus("picked_up")}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <i className="fas fa-box mr-1" /> Забрал заказ
              </button>
            </>
          )}

          {showCustomerRoute && order.delivery_address && (
            <>
              <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  <i className="fas fa-map-marker-alt mr-1 text-primary" /> Адрес доставки
                </p>
                <p className="text-sm text-foreground">{order.delivery_address.address}</p>

                {/* Address details */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {order.delivery_address.entrance && (
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-muted">Подъезд</p>
                      <p className="font-semibold text-foreground">{order.delivery_address.entrance}</p>
                    </div>
                  )}
                  {order.delivery_address.floor && (
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-muted">Этаж</p>
                      <p className="font-semibold text-foreground">{order.delivery_address.floor}</p>
                    </div>
                  )}
                  {order.delivery_address.apartment && (
                    <div className="rounded-lg bg-background p-2 text-center">
                      <p className="text-muted">Квартира</p>
                      <p className="font-semibold text-foreground">{order.delivery_address.apartment}</p>
                    </div>
                  )}
                </div>

                {order.delivery_address.comment && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-2">
                    <p className="text-xs text-muted">Комментарий</p>
                    <p className="text-sm text-foreground">{order.delivery_address.comment}</p>
                  </div>
                )}

                {order.customer_phone && (
                  <a href={`tel:${order.customer_phone}`} className="inline-flex items-center text-sm text-primary hover:underline">
                    <i className="fas fa-phone mr-1" /> {order.customer_phone}
                  </a>
                )}
              </div>
              <button
                onClick={() => updateStatus("delivered")}
                className="w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <i className="fas fa-check-circle mr-1" /> Вручил клиенту
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
