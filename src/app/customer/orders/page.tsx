"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { customerApi } from "@/lib/api-client";
import { useSession } from "@/components/session/session-context";
import { useRouter } from "next/navigation";

export default function CustomerOrdersPage(): React.ReactElement {
  const { isLoggedIn } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const data = await customerApi.getMyOrders();
      setOrders(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      setError(err.message || "Не удалось загрузить заказы");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    loadOrders();
  }, [isLoggedIn, loadOrders, router]);

  const cancelOrder = useCallback(async (orderId: string) => {
    if (!confirm("Отменить заказ?")) return;
    try {
      await customerApi.cancelOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось отменить"));
    }
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <i className="fas fa-spinner fa-spin text-3xl text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-3xl text-red-400" />
          <p className="mt-3 text-muted">{error}</p>
          <button
            onClick={loadOrders}
            className="mt-4 inline-block rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8 pt-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/customer" className="text-sm text-primary hover:underline">
              <i className="fas fa-arrow-left mr-1" /> На главную
            </Link>
            <h1 className="mt-2 font-heading text-2xl font-bold text-foreground">Мои заказы</h1>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-border-soft bg-card p-12 text-center">
            <i className="fas fa-receipt text-4xl text-muted mb-4 block" />
            <p className="text-lg text-foreground">У вас пока нет заказов</p>
            <Link href="/customer" className="mt-4 inline-block text-primary hover:underline">
              Перейти к ресторанам →
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                <Link href={`/customer/orders/${order.id}`} className="block">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">
                        Заказ #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(order.created_at).toLocaleString("ru")}
                      </p>
                      {order.distance_km && (
                        <p className="mt-1 text-xs text-muted">
                          <i className="fas fa-route mr-1" /> {order.distance_km} км
                          {order.eta_minutes && ` · ~${order.eta_minutes} мин`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">{order.total_amount} ₽</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs ${
                        order.status === "searching_courier" ? "bg-yellow-500/15 text-yellow-500" :
                        order.status === "accepted" ? "bg-blue-500/15 text-blue-500" :
                        order.status === "picked_up" ? "bg-purple-500/15 text-purple-500" :
                        order.status === "in_delivery" ? "bg-orange-500/15 text-orange-500" :
                        order.status === "delivered" ? "bg-green-500/15 text-green-500" :
                        order.status === "cancelled" ? "bg-red-500/15 text-red-500" :
                        "bg-border-soft text-muted"
                      }`}>
                        {order.status === "searching_courier" && "🔍 Ищем курьера"}
                        {order.status === "accepted" && "✓ Курьер найден"}
                        {order.status === "picked_up" && "📦 Забрал"}
                        {order.status === "in_delivery" && "🚗 В пути"}
                        {order.status === "delivered" && "✅ Доставлен"}
                        {order.status === "cancelled" && "❌ Отменён"}
                        {order.status === "pending" && "⏳ Ожидание"}
                        {order.status === "rejected" && "❌ Отклонён"}
                      </span>
                    </div>
                  </div>
                </Link>
                {(order.status === "searching_courier" || order.status === "accepted") && (
                  <button
                    onClick={() => cancelOrder(order.id)}
                    className="mt-3 w-full rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <i className="fas fa-times mr-1" /> Отменить
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
