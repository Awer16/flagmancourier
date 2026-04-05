"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session/session-context";
import { moderatorApi } from "@/lib/api-client";

export default function EnterpriseHome(): React.ReactElement {
  const { user, isLoggedIn, logout } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "enterprise") {
      router.push("/enterprise/login");
      return;
    }
    loadOrders();
  }, [isLoggedIn, user]);

  const loadOrders = useCallback(async () => {
    try {
      const data = await moderatorApi.getOrders();
      setOrders(data.filter((o: any) => 
        ["pending", "confirmed", "ready_for_pickup", "accepted", "picked_up", "in_delivery"].includes(o.status)
      ));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmOrder = useCallback(async (orderId: string) => {
    try {
      await moderatorApi.confirmOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось подтвердить"));
    }
  }, [loadOrders]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <i className="fas fa-spinner fa-spin text-3xl text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8 pt-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              Панель предприятия
            </h1>
            <p className="text-sm text-muted">{user?.fullName || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary">
              <i className="fas fa-home text-xs" /> Главная
            </Link>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20">
              <i className="fas fa-sign-out-alt text-xs" /> Выход
            </button>
          </div>
        </div>

        {/* Active Orders */}
        <div className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            <i className="fas fa-clipboard-list mr-2 text-primary" /> Активные заказы
          </h2>

          {orders.length === 0 ? (
            <p className="mt-4 text-center text-muted">Нет активных заказов</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {orders.map((order: any) => (
                <li key={order.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-border-soft/10 p-3">
                  <div>
                    <p className="font-medium text-foreground">Заказ #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleString("ru")} · {order.total_amount} ₽
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      order.status === "pending" ? "bg-yellow-500/15 text-yellow-500" :
                      order.status === "confirmed" ? "bg-blue-500/15 text-blue-500" :
                      order.status === "ready_for_pickup" ? "bg-purple-500/15 text-purple-500" :
                      "bg-green-500/15 text-green-500"
                    }`}>
                      {order.status === "pending" && "⏳ Ожидает"}
                      {order.status === "confirmed" && "✓ Подтверждён"}
                      {order.status === "ready_for_pickup" && "📦 Готов"}
                      {order.status === "accepted" && "🚴 Курьер принял"}
                      {order.status === "picked_up" && "📦 Курьер забрал"}
                      {order.status === "in_delivery" && "🚗 В пути"}
                    </span>
                    {order.status === "pending" && (
                      <button
                        onClick={() => confirmOrder(order.id)}
                        className="mt-2 w-full rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        <i className="fas fa-check mr-1" /> Подтвердить
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
