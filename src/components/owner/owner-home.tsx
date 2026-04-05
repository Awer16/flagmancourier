"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session/session-context";
import { ownerApi } from "@/lib/api-client";
import { useWebSocket } from "@/lib/use-websocket";

const inputClass =
  "w-full rounded-xl border border-border-soft bg-background px-3 py-2.5 text-base text-foreground placeholder:text-muted outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/40";
const labelClass = "text-sm font-medium text-foreground";

export default function OwnerHome(): React.ReactElement {
  const { user, isLoggedIn, logout } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Company form
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("restaurant");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyCity, setCompanyCity] = useState("Ростов-на-Дону");
  const [companyLat, setCompanyLat] = useState("47.2357");
  const [companyLon, setCompanyLon] = useState("39.7015");
  const [companyPhone, setCompanyPhone] = useState("");

  // Menu item form
  const [menuItemName, setMenuItemName] = useState("");
  const [menuItemPrice, setMenuItemPrice] = useState("");
  const [menuItemOldPrice, setMenuItemOldPrice] = useState("");
  const [menuItemCategory, setMenuItemCategory] = useState("main");
  const [menuItemDesc, setMenuItemDesc] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showMenuForm, setShowMenuForm] = useState(false);

  // Promo code form
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");
  const [promoMinAmount, setPromoMinAmount] = useState("");
  const [promoMaxUses, setPromoMaxUses] = useState("");
  const [promocodes, setPromocodes] = useState<any[]>([]);
  const [showPromoForm, setShowPromoForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "promo" | "orders">("menu");
  const [newOrderNotification, setNewOrderNotification] = useState<any>(null);

  // WebSocket subscriptions for each company
  const companyChannels = companies.map((c) => `company_${c.id}`);
  const wsMsg = useWebSocket(companyChannels.length > 0 ? companyChannels[0] : null, companies.length > 0);

  useEffect(() => {
    if (!isLoggedIn || user?.role !== "company_owner") {
      router.push("/owner/login");
      return;
    }
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  const loadCompanies = useCallback(async () => {
    try {
      const data = await ownerApi.getMyCompanies();
      setCompanies(data);
    } catch {
      console.error("Failed to load companies");
    }
  }, []);

  const loadMenu = useCallback(async (companyId: string) => {
    try {
      const data = await ownerApi.getMenu(companyId);
      setMenuItems(data);
    } catch {
      console.error("Failed to load menu");
    }
  }, []);

  const loadOrders = useCallback(async (companyId: string) => {
    try {
      const data = await ownerApi.getCompanyOrders(companyId);
      setOrders(data);
    } catch {
      console.error("Failed to load orders");
    }
  }, []);

  const createCompany = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const company = await ownerApi.createCompany({
        name: companyName,
        company_type: companyType,
        description: companyDesc || undefined,
        address: companyAddress || undefined,
        city: companyCity,
        latitude: companyLat,
        longitude: companyLon,
        phone: companyPhone || undefined,
      });
      setCompanyName("");
      setCompanyType("restaurant");
      setCompanyDesc("");
      setCompanyAddress("");
      setCompanyPhone("");
      setShowForm(false);
      await loadCompanies();
      // Refresh page to show on main page
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось создать компанию"));
    }
    setLoading(false);
  }, [companyName, companyDesc, companyAddress, companyLat, companyLon, companyPhone, loadCompanies]);

  const createMenuItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) return;
    setLoading(true);
    try {
      if (editingItemId) {
        await ownerApi.updateMenuItem(selectedCompanyId, editingItemId, {
          name: menuItemName,
          price: menuItemPrice,
          old_price: menuItemOldPrice || undefined,
          category: menuItemCategory,
          description: menuItemDesc || undefined,
        });
      } else {
        await ownerApi.createMenuItem(selectedCompanyId, {
          name: menuItemName,
          price: menuItemPrice,
          old_price: menuItemOldPrice || undefined,
          category: menuItemCategory,
          description: menuItemDesc || undefined,
        });
      }
      resetMenuForm();
      await loadMenu(selectedCompanyId);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось сохранить блюдо"));
    }
    setLoading(false);
  }, [selectedCompanyId, editingItemId, menuItemName, menuItemPrice, menuItemOldPrice, menuItemCategory, menuItemDesc, loadMenu]);

  const resetMenuForm = useCallback(() => {
    setMenuItemName("");
    setMenuItemPrice("");
    setMenuItemOldPrice("");
    setMenuItemDesc("");
    setEditingItemId(null);
    setShowMenuForm(false);
  }, []);

  const editMenuItem = useCallback((item: any) => {
    setMenuItemName(item.name);
    setMenuItemPrice(item.price);
    setMenuItemOldPrice(item.old_price || "");
    setMenuItemCategory(item.category || "main");
    setMenuItemDesc(item.description || "");
    setEditingItemId(item.id);
    setShowMenuForm(true);
  }, []);

  const confirmOrder = useCallback(async (orderId: string) => {
    if (!confirm("Принять заказ?")) return;
    try {
      await ownerApi.confirmOrder(orderId);
      if (selectedCompanyId) loadOrders(selectedCompanyId);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось подтвердить"));
    }
  }, [selectedCompanyId, loadOrders]);

  const orderReady = useCallback(async (orderId: string) => {
    if (!confirm("Заказ готов? Курьеры увидят его.")) return;
    try {
      await ownerApi.orderReady(orderId);
      if (selectedCompanyId) loadOrders(selectedCompanyId);
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось обновить"));
    }
  }, [selectedCompanyId, loadOrders]);

  const deleteMenuItem = useCallback(async (itemId: string) => {
    if (!selectedCompanyId) return;
    if (!confirm("Удалить блюдо?")) return;
    try {
      await ownerApi.deleteMenuItem(selectedCompanyId, itemId);
      await loadMenu(selectedCompanyId);
    } catch {
      // ignore
    }
  }, [selectedCompanyId, loadMenu]);

  const loadPromocodes = useCallback(async () => {
    try {
      const data = await ownerApi.getPromocodes();
      setPromocodes(data);
    } catch {
      // ignore
    }
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!wsMsg) return;
    if (wsMsg.type === "new_order") {
      setNewOrderNotification(wsMsg.order);
      if (selectedCompanyId) loadOrders(selectedCompanyId);
      setTimeout(() => setNewOrderNotification(null), 10000);
    }
  }, [wsMsg, selectedCompanyId, loadOrders]);

  const createPromocode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ownerApi.createPromocode({
        code: promoCode,
        discount_percent: promoDiscount,
        min_order_amount: promoMinAmount || undefined,
        max_uses: promoMaxUses || undefined,
      });
      setPromoCode("");
      setPromoDiscount("");
      setPromoMinAmount("");
      setPromoMaxUses("");
      setShowPromoForm(false);
      await loadPromocodes();
    } catch (err: any) {
      alert("Ошибка: " + (err.message || "Не удалось создать промокод"));
    }
    setLoading(false);
  }, [promoCode, promoDiscount, promoMinAmount, promoMaxUses]);

  const deletePromocode = useCallback(async (pcId: string) => {
    try {
      await ownerApi.deletePromocode(pcId);
      await loadPromocodes();
    } catch {
      // ignore
    }
  }, []);

  if (!isLoggedIn || user?.role !== "company_owner") {
    return <div className="flex items-center justify-center py-32">Загрузка...</div>;
  }

  return (
    <div className="min-h-dvh bg-background pb-8 pt-20">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
          <div>
            <h1 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
              Кабинет владельца
            </h1>
            <p className="text-sm text-muted">{user?.fullName || user?.email}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-border-soft bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <i className="fas fa-home text-xs" /> Главная
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
            >
              <i className="fas fa-sign-out-alt text-xs" /> Выход
            </button>
          </div>
        </div>

        {/* New Order Notification */}
        {newOrderNotification && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 animate-pulse">
            <i className="fas fa-bell text-yellow-500 text-lg" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-500">Новый заказ!</p>
              <p className="text-sm text-muted">
                Заказ #{newOrderNotification.id?.slice(0, 8)} · {newOrderNotification.total_amount} ₽
              </p>
            </div>
            <button
              onClick={() => setNewOrderNotification(null)}
              className="text-muted hover:text-foreground"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        )}

        {/* Companies */}
        <div className="mb-6 rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              <i className="fas fa-store mr-2 text-primary" /> Мои компании
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <i className="fas fa-plus text-xs" /> Добавить
            </button>
          </div>

          {showForm && (
            <form onSubmit={createCompany} className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Название *
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Название заведения"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Тип заведения *
                <select value={companyType} onChange={(e) => setCompanyType(e.target.value)} className={inputClass}>
                  <option value="restaurant">🍽️ Ресторан</option>
                  <option value="cafe">☕ Кафе</option>
                  <option value="bakery">🥐 Пекарня</option>
                  <option value="grocery">🛒 Магазин</option>
                  <option value="store">📦 Другое</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Описание
                <input
                  value={companyDesc}
                  onChange={(e) => setCompanyDesc(e.target.value)}
                  placeholder="Описание"
                  className={inputClass}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Город *
                <select value={companyCity} onChange={(e) => setCompanyCity(e.target.value)} className={inputClass}>
                  <option>Москва</option>
                  <option>Санкт-Петербург</option>
                  <option>Ростов-на-Дону</option>
                  <option>Казань</option>
                  <option>Екатеринбург</option>
                  <option>Новосибирск</option>
                  <option>Краснодар</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Адрес
                <input
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="ул. Примерная, 1"
                  className={inputClass}
                />
              </label>
              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                  Широта
                  <input value={companyLat} onChange={(e) => setCompanyLat(e.target.value)} className={inputClass} />
                </label>
                <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                  Долгота
                  <input value={companyLon} onChange={(e) => setCompanyLon(e.target.value)} className={inputClass} />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                Телефон
                <input value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} placeholder="+7..." className={inputClass} />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                Создать
              </button>
            </form>
          )}

          {companies.length === 0 ? (
            <p className="mt-4 text-center text-muted">Пока нет компаний</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className={`flex items-center justify-between rounded-xl border p-3 ${
                    c.id === selectedCompanyId ? "border-primary bg-primary/5" : "border-border-soft bg-border-soft/10"
                  } cursor-pointer transition-colors`}
                  onClick={() => {
                    setSelectedCompanyId(c.id);
                    loadMenu(c.id);
                    loadOrders(c.id);
                  }}
                >
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted">{c.city} · {c.address || "Адрес не указан"}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      c.moderation_status === "approved"
                        ? "bg-green-500/15 text-green-500"
                        : "bg-yellow-500/15 text-yellow-500"
                    }`}
                  >
                    {c.moderation_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Menu & Promos & Orders */}
        {selectedCompanyId && (
          <>
            {/* Tabs */}
            <div className="mb-4 flex gap-2">
              {[
                { key: "menu" as const, label: "Меню", icon: "fa-utensils" },
                { key: "promo" as const, label: "Промокоды", icon: "fa-tag" },
                { key: "orders" as const, label: "Заказы", icon: "fa-clipboard-list" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setActiveTab(t.key);
                    if (t.key === "promo") loadPromocodes();
                    if (t.key === "orders") loadOrders(selectedCompanyId);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                    activeTab === t.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-soft bg-card text-muted hover:border-primary/50"
                  }`}
                >
                  <i className={`fas ${t.icon} text-xs`} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Menu tab */}
            {activeTab === "menu" && (
              <div className="mb-6 rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    <i className="fas fa-utensils mr-2 text-primary" /> Меню
                  </h2>
                  <button
                    onClick={() => setShowMenuForm(!showMenuForm)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <i className="fas fa-plus text-xs" /> Добавить блюдо
                  </button>
                </div>

                {showMenuForm && (
                  <form onSubmit={createMenuItem} className="mt-4 flex flex-col gap-3 rounded-xl border border-border-soft bg-border-soft/10 p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {editingItemId ? "Редактировать блюдо" : "Новое блюдо"}
                      </h3>
                      <button type="button" onClick={resetMenuForm} className="text-muted hover:text-foreground">
                        <i className="fas fa-times" />
                      </button>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                      Название *
                      <input value={menuItemName} onChange={(e) => setMenuItemName(e.target.value)} required className={inputClass} />
                    </label>
                    <div className="flex gap-3">
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Цена *
                        <input value={menuItemPrice} onChange={(e) => setMenuItemPrice(e.target.value)} required placeholder="350" className={inputClass} />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Старая цена
                        <input value={menuItemOldPrice} onChange={(e) => setMenuItemOldPrice(e.target.value)} placeholder="450 (для скидки)" className={inputClass} />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Категория
                        <select value={menuItemCategory} onChange={(e) => setMenuItemCategory(e.target.value)} className={inputClass}>
                          <option value="main">Основное</option>
                          <option value="drinks">Напитки</option>
                          <option value="desserts">Десерты</option>
                          <option value="salads">Салаты</option>
                          <option value="soups">Супы</option>
                          <option value="snacks">Закуски</option>
                        </select>
                      </label>
                    </div>
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                      Описание
                      <input value={menuItemDesc} onChange={(e) => setMenuItemDesc(e.target.value)} className={inputClass} />
                    </label>
                    <button type="submit" disabled={loading} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                      {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                      Добавить
                    </button>
                  </form>
                )}

                {menuItems.length === 0 ? (
                  <p className="mt-4 text-center text-muted">Меню пусто</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-2">
                    {menuItems.map((item: any) => (
                      <li key={item.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-border-soft/10 p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted">{item.category}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right mr-2">
                            {item.old_price && (
                              <p className="text-xs text-muted line-through">{item.old_price} ₽</p>
                            )}
                            <p className="font-semibold text-primary">{item.price} ₽</p>
                          </div>
                          <button
                            onClick={() => editMenuItem(item)}
                            className="rounded-lg bg-blue-500/10 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/20"
                          >
                            <i className="fas fa-pen" />
                          </button>
                          <button
                            onClick={() => deleteMenuItem(item.id)}
                            className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Promo tab */}
            {activeTab === "promo" && (
              <div className="mb-6 rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold text-foreground">
                    <i className="fas fa-tag mr-2 text-primary" /> Промокоды
                  </h2>
                  <button
                    onClick={() => setShowPromoForm(!showPromoForm)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    <i className="fas fa-plus text-xs" /> Создать
                  </button>
                </div>

                {showPromoForm && (
                  <form onSubmit={createPromocode} className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
                      Код *
                      <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} required placeholder="SALE20" className={inputClass} />
                    </label>
                    <div className="flex gap-3">
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Скидка % *
                        <input value={promoDiscount} onChange={(e) => setPromoDiscount(e.target.value)} required placeholder="20" className={inputClass} />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Мин. сумма
                        <input value={promoMinAmount} onChange={(e) => setPromoMinAmount(e.target.value)} placeholder="500" className={inputClass} />
                      </label>
                      <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-foreground">
                        Макс. использований
                        <input value={promoMaxUses} onChange={(e) => setPromoMaxUses(e.target.value)} placeholder="100" className={inputClass} />
                      </label>
                    </div>
                    <button type="submit" disabled={loading} className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
                      {loading ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-check" />}
                      Создать промокод
                    </button>
                  </form>
                )}

                {promocodes.length === 0 ? (
                  <p className="mt-4 text-center text-muted">Нет промокодов</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-2">
                    {promocodes.map((pc: any) => (
                      <li key={pc.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-border-soft/10 p-3">
                        <div>
                          <p className="font-mono font-semibold text-primary">{pc.code}</p>
                          <p className="text-xs text-muted">
                            {pc.discount_percent}% скидка
                            {pc.min_order_amount && ` · от ${pc.min_order_amount}₽`}
                            {pc.max_uses && ` · ${pc.used_count}/${pc.max_uses}`}
                          </p>
                        </div>
                        <button
                          onClick={() => deletePromocode(pc.id)}
                          className="rounded-lg bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Orders tab */}
            {activeTab === "orders" && orders.length > 0 && (
              <div className="rounded-2xl border border-border-soft bg-card p-4 shadow-[var(--shadow-card)]">
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  <i className="fas fa-clipboard-list mr-2 text-primary" /> Заказы
                </h2>
                <ul className="mt-4 flex flex-col gap-2">
                  {orders.map((order: any) => (
                    <li key={order.id} className="flex items-center justify-between rounded-xl border border-border-soft bg-border-soft/10 p-3">
                      <div>
                        <p className="font-medium text-foreground">Заказ #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted">{new Date(order.created_at).toLocaleString("ru")}</p>
                        <p className="text-xs text-muted">
                          {order.distance_km && `${order.distance_km} км · `}
                          {order.eta_minutes && `~${order.eta_minutes} мин`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{order.total_amount} ₽</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                          order.status === "pending" ? "bg-yellow-500/15 text-yellow-500" :
                          order.status === "confirmed" ? "bg-blue-500/15 text-blue-500" :
                          order.status === "accepted" ? "bg-indigo-500/15 text-indigo-500" :
                          order.status === "ready_for_pickup" ? "bg-purple-500/15 text-purple-500" :
                          order.status === "picked_up" ? "bg-orange-500/15 text-orange-500" :
                          order.status === "in_delivery" ? "bg-amber-500/15 text-amber-500" :
                          order.status === "delivered" ? "bg-green-500/15 text-green-500" :
                          "bg-border-soft text-muted"
                        }`}>
                          {order.status === "pending" && "⏳ Новый"}
                          {order.status === "confirmed" && "✓ Принят"}
                          {order.status === "accepted" && "🚴 Курьер принят"}
                          {order.status === "ready_for_pickup" && "📦 Отдан курьеру"}
                          {order.status === "picked_up" && "📦 Курьер забрал"}
                          {order.status === "in_delivery" && "🚗 В пути"}
                          {order.status === "delivered" && "✅ Доставлен"}
                          {order.status === "cancelled" && "❌ Отменён"}
                        </span>
                        {order.status === "pending" && (
                          <button
                            onClick={() => confirmOrder(order.id)}
                            className="mt-2 w-full rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            <i className="fas fa-check mr-1" /> Принять
                          </button>
                        )}
                        {order.status === "accepted" && (
                          <button
                            onClick={() => orderReady(order.id)}
                            className="mt-2 w-full rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            <i className="fas fa-handshake mr-1" /> Отдать курьеру
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Empty orders */}
            {activeTab === "orders" && orders.length === 0 && (
              <div className="rounded-2xl border border-border-soft bg-card p-8 text-center">
                <i className="fas fa-clipboard-list text-4xl text-muted mb-3 block" />
                <p className="text-muted">Нет заказов</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
