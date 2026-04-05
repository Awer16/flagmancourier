// API Client for Delivery Aggregator Backend (FastAPI)
// Use relative URL so Next.js rewrites proxy the request (avoids CORS)
const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api");

const TOKEN_KEY = "auth_token";

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};

  // Use sessionStorage (per-tab storage)
  const storage = window.sessionStorage;

  // Check all possible token storage keys, prefer the most recent
  const tokenKeys = [
    "courier-here-session_customer", // session key - look for associated token
    "courier-here-session_courier",
    "courier-here-session_company_owner",
    "courier-here-session_moderator",
    "auth_token",           // generic (most common)
    "auth_token_customer",  // role-specific
    "auth_token_courier",
    "auth_token_company_owner",
    "auth_token_moderator",
  ];

  for (const key of tokenKeys) {
    try {
      if (key.startsWith("courier-here-session")) {
        // Session key - check if logged in, then use corresponding token
        const raw = storage.getItem(key);
        if (raw) {
          const s = JSON.parse(raw);
          if (s.isLoggedIn) {
            const role = key.replace("courier-here-session_", "");
            const token = storage.getItem(`auth_token_${role}`);
            if (token) return { Authorization: `Bearer ${token}` };
          }
        }
      } else {
        // Direct token key
        const token = storage.getItem(key);
        if (token) return { Authorization: `Bearer ${token}` };
      }
    } catch { /* ignore */ }
  }

  return {};
}

// ---------- Types matching backend schemas ----------

export interface BackendCompany {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  latitude: string;
  longitude: string;
  phone: string | null;
  moderation_status: string;
  is_blocked: boolean;
}

export interface BackendMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: string;
  old_price: string | null;
  category: string;
  image_url: string | null;
  is_available: boolean;
  moderation_status: string;
}

export interface BackendPromoCode {
  id: string;
  code: string;
  discount_percent: string;
  min_order_amount: string | null;
  max_uses: string | null;
  used_count: string;
  expires_at: string | null;
  is_active: boolean;
  company_id: string | null;
}

export interface BackendDeliveryZone {
  id: string;
  name: string;
  center_latitude: string;
  center_longitude: string;
  radius_km: string;
}

export interface BackendDeliveryAddress {
  id: string;
  label: string | null;
  address: string;
  floor: string | null;
  apartment: string | null;
}

export interface BackendOrderItem {
  id: string;
  menu_item_id: string;
  quantity: string;
  price_at_order: string;
  courier_earnings?: string;
}

export interface BackendOrder {
  id: string;
  company_id: string;
  status: string;
  total_amount: string;
  delivery_fee: string;
  distance_km: string | null;
  eta_minutes: string | null;
  original_amount: string | null;
  created_at: string;
  courier_id: string | null;
}

export interface BackendOrderFull extends BackendOrder {
  items: BackendOrderItem[];
  delivery_address: BackendDeliveryAddress | null;
  customer_phone: string | null;
  customer_details: string | null;
}

export interface BackendCourierSession {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
}

export interface BackendCourierOrderPreview {
  id: string;
  company_name: string;
  company_address: string;
  total_amount: string;
  distance_km: string | null;
  status: string;
  created_at: string;
}

export interface BackendUser {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string | null;
  role: string;
  is_blocked: boolean;
}

// ---------- Core fetch helper ----------

// Timeout wrapper for fetch (15 seconds)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };

  try {
    const res = await fetchWithTimeout(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(
        `API ${res.status} ${path}: ${body?.detail ?? res.statusText}`
      );
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as unknown as T;

    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("API timeout: check backend is running");
    }
    if (err instanceof TypeError && err.message === "Failed to fetch") {
      throw new Error("Нет соединения с сервером. Проверьте подключение.");
    }
    throw err;
  }
}

// ---------- Auth API ----------

export const authApi = {
  register(data: {
    email: string;
    password: string;
    phone: string;
    first_name: string;
    last_name?: string;
    role?: string;
  }) {
    return apiFetch<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        phone: data.phone,
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role || "customer",
      }),
    });
  },

  login(email: string, password: string) {
    return apiFetch<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  refreshToken(refresh: string) {
    return apiFetch<{
      access_token: string;
      refresh_token: string;
      token_type: string;
    }>(`/auth/refresh?refresh=${refresh}`);
  },

  getMe() {
    return apiFetch<BackendUser>("/auth/me");
  },
};

// ---------- Customer API ----------

export const customerApi = {
  /** List approved companies, optionally filtered by city */
  getCompanies(city?: string) {
    const qs = city ? `?city=${encodeURIComponent(city)}` : "";
    return apiFetch<BackendCompany[]>(`/customer/companies${qs}`);
  },

  /** Get list of cities that have restaurants */
  getAvailableCities() {
    return apiFetch<string[]>("/customer/companies/cities");
  },

  /** Get single company */
  getCompany(companyId: string) {
    return apiFetch<BackendCompany>(`/customer/companies/${companyId}`);
  },

  /** Get company by slug */
  getCompanyBySlug(slug: string) {
    return apiFetch<BackendCompany>(`/customer/companies/by-slug/${slug}`);
  },

  /** Get company menu */
  getCompanyMenu(companyId: string) {
    return apiFetch<BackendMenuItem[]>(`/customer/companies/${companyId}/menu`);
  },

  /** Delivery addresses */
  getAddresses() {
    return apiFetch<BackendDeliveryAddress[]>("/customer/addresses");
  },

  createAddress(data: {
    address: string;
    latitude: string;
    longitude: string;
    label?: string;
    floor?: string;
    apartment?: string;
    comment?: string;
  }) {
    return apiFetch<BackendDeliveryAddress>("/customer/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  deleteAddress(addressId: string) {
    return apiFetch<void>(`/customer/addresses/${addressId}`, {
      method: "DELETE",
    });
  },

  /** Orders */
  createOrder(data: {
    company_id: string;
    delivery_address_id: string;
    items: { menu_item_id: string; quantity: number }[];
    promo_code?: string;
    comment?: string;
  }) {
    return apiFetch<BackendOrderFull>("/customer/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  validatePromoCode(data: {
    code: string;
    company_id: string;
    order_amount: string;
  }) {
    return apiFetch<{
      valid: boolean;
      discount_percent: string | null;
      final_amount: string | null;
      error: string | null;
    }>("/customer/promo/validate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyOrders() {
    return apiFetch<BackendOrder[]>("/customer/orders");
  },

  getOrder(orderId: string) {
    return apiFetch<BackendOrderFull>(`/customer/orders/${orderId}`);
  },

  cancelOrder(orderId: string) {
    return apiFetch<BackendOrder>(`/customer/orders/${orderId}/cancel`, {
      method: "POST",
    });
  },
};

// ---------- Courier API ----------

export const courierApi = {
  getProfile() {
    return apiFetch<{ balance: string; first_name: string; role: string }>("/courier/profile");
  },

  startSession(city?: string, district?: string) {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    return apiFetch<BackendCourierSession>(
      `/courier/session/start?${params}`,
      { method: "POST" }
    );
  },

  endSession() {
    return apiFetch<BackendCourierSession>("/courier/session/end", {
      method: "POST",
    });
  },

  getSession() {
    return apiFetch<BackendCourierSession>("/courier/session");
  },

  getAvailableOrders() {
    return apiFetch<BackendCourierOrderPreview[]>(
      "/courier/orders/available"
    );
  },

  acceptOrder(orderId: string) {
    return apiFetch<BackendOrderFull>(`/courier/orders/${orderId}/accept`, {
      method: "POST",
    });
  },

  updateOrderStatus(orderId: string, status: string) {
    return apiFetch<BackendOrderFull>(
      `/courier/orders/${orderId}/status?status_new=${status}`,
      { method: "PATCH" }
    );
  },

  getCompletedOrders() {
    return apiFetch<BackendOrderFull[]>("/courier/orders/completed");
  },

  getMyOrders() {
    return apiFetch<BackendOrderFull[]>("/courier/orders/my");
  },
};

// ---------- Owner API ----------

export const ownerApi = {
  createCompany(data: {
    name: string;
    company_type?: string;
    description?: string;
    address?: string;
    city?: string;
    latitude: string;
    longitude: string;
    phone?: string;
  }) {
    return apiFetch<BackendCompany>("/owner/companies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMyCompanies() {
    return apiFetch<BackendCompany[]>("/owner/companies");
  },

  getCompany(companyId: string) {
    return apiFetch<BackendCompany>(`/owner/companies/${companyId}`);
  },

  updateCompany(
    companyId: string,
    data: {
      name?: string;
      description?: string;
      address?: string;
      phone?: string;
    }
  ) {
    return apiFetch<BackendCompany>(`/owner/companies/${companyId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  // Menu
  createMenuItem(
    companyId: string,
    data: {
      name: string;
      description?: string;
      price: string;
      old_price?: string;
      category?: string;
      image_url?: string;
    }
  ) {
    return apiFetch<BackendMenuItem>(`/owner/companies/${companyId}/menu`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getMenu(companyId: string) {
    return apiFetch<BackendMenuItem[]>(`/owner/companies/${companyId}/menu`);
  },

  updateMenuItem(
    companyId: string,
    itemId: string,
    data: {
      name?: string;
      description?: string;
      price?: string;
      old_price?: string;
      category?: string;
      image_url?: string;
      is_available?: boolean;
    }
  ) {
    return apiFetch<BackendMenuItem>(
      `/owner/companies/${companyId}/menu/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    );
  },

  deleteMenuItem(companyId: string, itemId: string) {
    return apiFetch<void>(`/owner/companies/${companyId}/menu/${itemId}`, {
      method: "DELETE",
    });
  },

  // Delivery zones
  createZone(
    companyId: string,
    data: {
      name: string;
      center_latitude: string;
      center_longitude: string;
      radius_km: string;
    }
  ) {
    return apiFetch<BackendDeliveryZone>(
      `/owner/companies/${companyId}/zones`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  getZones(companyId: string) {
    return apiFetch<BackendDeliveryZone[]>(
      `/owner/companies/${companyId}/zones`
    );
  },

  // Orders
  getCompanyOrders(companyId: string) {
    return apiFetch<BackendOrder[]>(`/owner/companies/${companyId}/orders`);
  },

  confirmOrder(orderId: string) {
    return apiFetch<BackendOrder>(`/owner/orders/${orderId}/confirm`, {
      method: "POST",
    });
  },

  orderReady(orderId: string) {
    return apiFetch<BackendOrder>(`/owner/orders/${orderId}/ready`, {
      method: "POST",
    });
  },
  // Promo codes
  createPromocode(data: {
    code: string;
    discount_percent: string;
    min_order_amount?: string;
    max_uses?: string;
    expires_at?: string;
    company_id?: string;
  }) {
    return apiFetch<BackendPromoCode>("/owner/promocodes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getPromocodes() {
    return apiFetch<BackendPromoCode[]>("/owner/promocodes");
  },

  deletePromocode(pcId: string) {
    return apiFetch<void>(`/owner/promocodes/${pcId}`, {
      method: "DELETE",
    });
  },
};

// ---------- Moderator API ----------

export const moderatorApi = {
  getPendingCompanies() {
    return apiFetch<BackendCompany[]>("/moderator/companies/pending");
  },

  moderateCompany(companyId: string, action: string) {
    return apiFetch<BackendCompany>(
      `/moderator/companies/${companyId}/moderate`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      }
    );
  },

  getPendingMenuItems() {
    return apiFetch<BackendMenuItem[]>("/moderator/menu/pending");
  },

  moderateMenuItem(itemId: string, action: string) {
    return apiFetch<BackendMenuItem>(
      `/moderator/menu/${itemId}/moderate`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      }
    );
  },

  getPendingCouriers() {
    return apiFetch<BackendUser[]>("/moderator/couriers/pending");
  },

  moderateCourier(courierId: string, action: string) {
    return apiFetch<BackendUser>(
      `/moderator/couriers/${courierId}/moderate`,
      {
        method: "POST",
        body: JSON.stringify({ action }),
      }
    );
  },

  getOrders(statusFilter?: string) {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : "";
    return apiFetch<BackendOrder[]>(`/moderator/orders${qs}`);
  },

  getStats() {
    return apiFetch<{
      companies_pending: number;
      menu_items_pending: number;
      couriers_pending: number;
      total_orders: number;
      active_couriers: number;
    }>("/moderator/stats");
  },

  confirmOrder(orderId: string) {
    return apiFetch<BackendOrder>(`/owner/orders/${orderId}/confirm`, {
      method: "POST",
    });
  },
};

// ---------- Public aliases (compatibility) ----------

export const publicApi = {
  getCompanies: (city?: string) => customerApi.getCompanies(city),
  getCompany: customerApi.getCompany,
  getCompanyMenu: customerApi.getCompanyMenu,
  getAvailableCities: customerApi.getAvailableCities,
};

export const ordersApi = {
  getAddresses: customerApi.getAddresses,
  createAddress: customerApi.createAddress,
  createOrder: customerApi.createOrder,
  getMyOrders: customerApi.getMyOrders,
  getOrder: customerApi.getOrder,
  cancelOrder: customerApi.cancelOrder,
};
