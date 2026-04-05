"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session/session-context";
import { courierApi } from "@/lib/api-client";
import { useWebSocket } from "@/lib/use-websocket";

const ROSTOV_DISTRICTS = [
  "Все районы",
  "Ворошиловский",
  "Советский",
  "Октябрьский",
  "Первомайский",
  "Ленинский",
  "Кировский",
  "Пролетарский",
  "Железнодорожный",
];

export default function CourierHome(): React.ReactElement {
  const { user, isLoggedIn, logout } = useSession();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"available" | "my" | "completed">("available");
  const [selectedDistrict, setSelectedDistrict] = useState("Все районы");
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "courier") {
      router.push("/courier/login");
      return;
    }
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  // WebSocket subscriptions
  const newOrderMsg = useWebSocket("global_orders", !!session);
  const courierMsg = useWebSocket(user?.id ? `courier_${user.id}` : null, !!session);

  const loadSession = useCallback(async () => {
    try {
      const s = await courierApi.getSession();
      setSession(s);
    } catch {
      setSession(null);
    }
  }, []);

  const startSession = useCallback(async () => {
    setLoading(true);
    try {
      const district = selectedDistrict === "Все районы" ? undefined : selectedDistrict;
      const s = await courierApi.startSession("Ростов-на-Дону", district);
      setSession(s);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось начать смену"));
    }
    setLoading(false);
  }, [selectedDistrict]);

  const endSession = useCallback(async () => {
    setLoading(true);
    try {
      await courierApi.endSession();
      setSession(null);
      setAvailableOrders([]);
      setMyOrders([]);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось завершить смену"));
    }
    setLoading(false);
  }, []);

  const loadAvailableOrders = useCallback(async () => {
    try {
      const orders = await courierApi.getAvailableOrders();
      setAvailableOrders(orders);
    } catch {
      // ignore
    }
  }, []);

  const loadMyOrders = useCallback(async () => {
    try {
      const orders = await courierApi.getMyOrders();
      setMyOrders(orders);
    } catch {
      // ignore
    }
  }, []);

  // Polling when session is active
  useEffect(() => {
    if (!session) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    loadAvailableOrders();
    loadMyOrders();
    courierApi.getProfile().then(p => setBalance(p.balance)).catch(() => {});
    pollingRef.current = setInterval(() => {
      loadAvailableOrders();
      loadMyOrders();
    }, 5000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((msg: any) => {
    if (!session) return;
    if (msg.type === "order_available") {
      loadAvailableOrders();
      setNewOrderAlert(true);
      setTimeout(() => setNewOrderAlert(false), 5000);
    }
    if (msg.type === "order_status_update") {
      loadMyOrders();
    }
  }, [session, loadAvailableOrders, loadMyOrders]);

  useEffect(() => {
    if (newOrderMsg) handleWsMessage(newOrderMsg);
  }, [newOrderMsg, handleWsMessage]);

  useEffect(() => {
    if (courierMsg && session && courierMsg.type === "order_status_update") {
      loadMyOrders();
    }
  }, [courierMsg, session, loadMyOrders]);

  const loadCompletedOrders = useCallback(async () => {
    try {
      const orders = await courierApi.getCompletedOrders();
      setCompletedOrders(orders);
    } catch {
      // ignore
    }
  }, []);

  const acceptOrder = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const order = await courierApi.acceptOrder(orderId);
      setMyOrders((prev) => [order, ...prev.filter((o) => o.id !== orderId)]);
      setAvailableOrders((prev) => prev.filter((o) => o.id !== orderId));
      setTab("my");
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось принять заказ"));
    }
    setLoading(false);
  }, []);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    setLoading(true);
    try {
      await courierApi.updateOrderStatus(orderId, status);
      await loadMyOrders();
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось обновить статус"));
    }
    setLoading(false);
  }, [loadMyOrders]);

  if (!isLoggedIn || user?.role !== "courier") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-3xl text-primary" />
          <p className="mt-3 text-muted">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-8 pt-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              Кабинет курьера
            </h1>
            <p className="text-sm text-muted">{user?.fullName || user?.email}</p>
            <p className="mt-1 text-lg font-semibold text-green-500">
              <i className="fas fa-wallet mr-1" /> Баланс: {balance} ₽
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!session ? (
              <div className="flex flex-col gap-3 w-full">
                <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3">
                  <p className="mb-2 text-xs font-medium text-muted">Район доставки</p>
                  <div className="flex flex-wrap gap-1.5">
                    {ROSTOV_DISTRICTS.map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDistrict(d)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          selectedDistrict === d
                            ? "bg-primary text-primary-foreground"
                            : "border border-border-soft bg-background text-muted hover:border-primary/50"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={startSession}
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <i className="fas fa-play text-xs" /> Начать смену
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={endSession}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <i className="fas fa-stop text-xs" /> Завершить
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-background px-3 py-2.5 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <i className="fas fa-home text-xs" />
                </Link>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/20"
                >
                  <i className="fas fa-sign-out-alt text-xs" />
                </button>
              </>
            )}
          </div>
        </div>

        {session && (
          <>
          {/* New Order Alert */}
          {newOrderAlert && (
            <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 animate-bounce">
              <div className="flex items-center gap-3">
                <i className="fas fa-bell text-primary text-lg animate-pulse" />
                <p className="font-semibold text-primary">🔔 Новый заказ доступен!</p>
              </div>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <p className="text-sm font-medium text-green-500">
                Смена активна · {session.city || "Ростов-на-Дону"}
                {session.district && ` · ${session.district}`}
              </p>
            </div>
            <p className="text-xs text-muted">
              <i className="fas fa-sync-alt mr-1" /> Автообновление 5с
            </p>
          </div>
          </>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {[
            { key: "available" as const, label: "Доступные", icon: "fa-list", count: availableOrders.length },
            { key: "my" as const, label: "Мои", icon: "fa-box", count: myOrders.length },
            { key: "completed" as const, label: "Выполнены", icon: "fa-check-circle", count: completedOrders.length },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key);
                if (t.key === "completed") loadCompletedOrders();
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border-soft bg-card text-muted hover:border-primary/50"
              }`}
            >
              <i className={`fas ${t.icon} text-xs`} />
              <span className="hidden sm:inline">{t.label}</span>
              {t.count > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                  tab === t.key ? "bg-primary/20" : "bg-border-soft"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Available Orders */}
        {tab === "available" && (
          <div>
            {availableOrders.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-card p-8 text-center">
                <i className="fas fa-inbox text-4xl text-muted mb-3 block" />
                <p className="text-muted">Нет доступных заказов</p>
                <p className="mt-1 text-xs text-muted">Они появятся здесь когда кто-то оформит заказ</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {availableOrders.map((order) => (
                  <li key={order.id} className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{order.company_name}</p>
                        <p className="text-sm text-muted">
                          <i className="fas fa-map-marker-alt mr-1 text-primary" />
                          {order.company_address}
                        </p>
                        {order.distance_km && (
                          <p className="mt-1 text-xs text-muted">
                            <i className="fas fa-route mr-1" /> {order.distance_km} км
                          </p>
                        )}
                        <p className="mt-1 text-xs text-muted">
                          <i className="fas fa-clock mr-1" /> {new Date(order.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-primary">{order.total_amount} ₽</p>
                        <button
                          onClick={() => acceptOrder(order.id)}
                          disabled={loading}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <i className="fas fa-check" /> Принять
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* My Orders */}
        {tab === "my" && (
          <div>
            {myOrders.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-card p-8 text-center">
                <i className="fas fa-box-open text-4xl text-muted mb-3 block" />
                <p className="text-muted">Нет активных заказов</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {myOrders.map((order) => (
                  <li key={order.id} className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">
                          Заказ #{order.id.slice(0, 8)}
                        </p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          order.status === "searching_courier" ? "bg-yellow-500/15 text-yellow-500" :
                          order.status === "accepted" ? "bg-blue-500/15 text-blue-500" :
                          order.status === "picked_up" ? "bg-purple-500/15 text-purple-500" :
                          "bg-orange-500/15 text-orange-500"
                        }`}>
                          {order.status === "searching_courier" && "Ожидает"}
                          {order.status === "accepted" && "Принят"}
                          {order.status === "picked_up" && "Забрал"}
                          {order.status === "in_delivery" && "В пути"}
                        </span>
                      </div>

                      {order.status === "searching_courier" && (
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                          <p className="text-sm font-medium text-foreground">
                            <i className="fas fa-utensils mr-1 text-yellow-500" /> Ресторан готовит заказ
                          </p>
                          <p className="mt-1 text-xs text-muted">После готовности статус изменится на "Принят"</p>
                        </div>
                      )}

                      {order.delivery_address && order.status !== "searching_courier" && (
                        <div className="rounded-xl border border-border-soft bg-border-soft/10 p-3">
                          <p className="text-sm font-medium text-foreground">
                            <i className="fas fa-map-marker-alt mr-1 text-primary" />
                            {order.delivery_address.address}
                          </p>
                          {order.delivery_address.floor && (
                            <p className="mt-1 text-xs text-muted">
                              Этаж: {order.delivery_address.floor}
                              {order.delivery_address.apartment && ` · Кв: ${order.delivery_address.apartment}`}
                            </p>
                          )}
                        </div>
                      )}

                      {order.customer_phone && order.status !== "searching_courier" && (
                        <a
                          href={`tel:${order.customer_phone}`}
                          className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <i className="fas fa-phone" />
                          {order.customer_phone}
                        </a>
                      )}

                      <p className="text-sm font-medium text-foreground">
                        Сумма: {order.total_amount} ₽
                        {order.distance_km && ` · ${order.distance_km} км`}
                      </p>

                      {/* Status buttons */}
                      <div className="flex gap-2">
                        {order.status === "accepted" && (
                          <div className="flex-1 rounded-xl bg-indigo-500/10 px-3 py-2 text-center text-xs font-medium text-indigo-500">
                            <i className="fas fa-clock mr-1" /> Ожидает выдачи из ресторана
                          </div>
                        )}
                        {order.status === "ready_for_pickup" && (
                          <>
                            <Link
                              href={`/courier/delivery/${order.id}`}
                              className="flex-1 rounded-xl bg-blue-500 px-3 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              <i className="fas fa-map mr-1" /> На маршрут
                            </Link>
                            <button
                              onClick={() => updateStatus(order.id, "picked_up")}
                              className="flex-1 rounded-xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                            >
                              <i className="fas fa-box mr-1" /> Забрал
                            </button>
                          </>
                        )}
                        {order.status === "picked_up" && (
                          <Link
                            href={`/courier/delivery/${order.id}`}
                            className="flex-1 rounded-xl bg-orange-500 px-3 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            <i className="fas fa-truck mr-1" /> В пути к клиенту
                          </Link>
                        )}
                        {order.status === "in_delivery" && (
                          <Link
                            href={`/courier/delivery/${order.id}`}
                            className="flex-1 rounded-xl bg-green-500 px-3 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            <i className="fas fa-check-circle mr-1" /> Вручить клиенту
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Completed Orders */}
        {tab === "completed" && (
          <div>
            {completedOrders.length === 0 ? (
              <div className="rounded-2xl border border-border-soft bg-card p-8 text-center">
                <i className="fas fa-check-double text-4xl text-muted mb-3 block" />
                <p className="text-muted">Нет выполненных заказов</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {completedOrders.map((order: any) => (
                  <li key={order.id} className="rounded-2xl border border-border-soft bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Заказ #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted">{new Date(order.created_at).toLocaleString("ru")}</p>
                      </div>
                      <div className="text-right">
                        {order.courier_earnings ? (
                          <>
                            <p className="font-semibold text-green-500">+{order.courier_earnings} ₽</p>
                            <p className="text-xs text-muted">за доставку</p>
                          </>
                        ) : (
                          <p className="font-semibold text-green-500">{order.total_amount} ₽</p>
                        )}
                        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-500">
                          Доставлен
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
