// API Client for the Delivery Aggregator Backend
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// ---------- Types matching backend schemas ----------

export interface BackendCompany {
  id: number;
  owner_id: number;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  // Enriched fields from /public/companies
  menu_items_count?: number;
  min_price?: number;
  categories_count?: number;
}

export interface BackendMenuItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  weight: number | null;
  image_url: string | null;
  is_available: boolean;
  is_approved: boolean;
  sort_order: number;
}

export interface BackendMenuCategory {
  id: number;
  menu_id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
  items?: BackendMenuItem[];
}

export interface BackendMenu {
  id: number;
  company_id: number;
  name: string;
  is_active: boolean;
  categories?: BackendMenuCategory[];
}

export interface BackendSalesPoint {
  id: number;
  company_id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  working_hours_start: string | null;
  working_hours_end: string | null;
  is_active: boolean;
}

export interface BackendDeliveryZone {
  id: number;
  company_id: number;
  name: string;
  polygon: Array<{ lat: number; lng: number }>;
  center_latitude: number;
  center_longitude: number;
  delivery_fee: number;
  min_order_amount: number;
  estimated_delivery_minutes: number;
  is_active: boolean;
}

export interface BackendOrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price_at_order: number;
  total: number;
}

export interface BackendOrder {
  id: number;
  customer_id: number;
  company_id: number;
  courier_id: number | null;
  status: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_comment: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  courier_assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  items?: BackendOrderItem[];
}

// ---------- Core fetch helper ----------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // send cookies for session auth
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
}

// ---------- Public API (no auth required) ----------

export const publicApi = {
  /** List approved companies with search */
  getCompanies(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    sort_by?: "name" | "created_at";
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.search) qs.set("search", params.search);
    if (params?.sort_by) qs.set("sort_by", params.sort_by);
    return apiFetch<{
      items: BackendCompany[];
      total: number;
      page: number;
      per_page: number;
      pages: number;
    }>(`/public/companies?${qs}`);
  },

  /** Get single company details */
  getCompany(companyId: number) {
    return apiFetch<BackendCompany>(`/public/companies/${companyId}`);
  },

  /** Get company menus with categories and items */
  getCompanyMenus(companyId: number) {
    return apiFetch<BackendMenu[]>(
      `/public/companies/${companyId}/menus`
    );
  },

  /** Get menu with categories and items */
  getMenu(menuId: number) {
    return apiFetch<BackendMenu>(`/public/menus/${menuId}`);
  },

  /** Get sales points for a company */
  getCompanyPoints(companyId: number) {
    return apiFetch<BackendSalesPoint[]>(
      `/public/companies/${companyId}/points`
    );
  },

  /** Get delivery zones for a company */
  getCompanyZones(companyId: number) {
    return apiFetch<BackendDeliveryZone[]>(
      `/public/companies/${companyId}/zones`
    );
  },

  /** Check if lat/lng is inside a delivery zone */
  checkDeliveryZone(companyId: number, latitude: number, longitude: number) {
    return apiFetch<{
      in_zone: boolean;
      zone?: {
        id: number;
        name: string;
        delivery_fee: number;
        min_order_amount: number;
        estimated_delivery_minutes: number;
      };
    }>(
      `/public/zones/check-delivery?company_id=${companyId}&latitude=${latitude}&longitude=${longitude}`
    );
  },

  /** Search menu items across all companies */
  searchItems(query: string, params?: { page?: number; per_page?: number; company_id?: number }) {
    const qs = new URLSearchParams();
    qs.set("query", query);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.company_id) qs.set("company_id", String(params.company_id));
    return apiFetch<{
      items: Array<{
        id: number;
        name: string;
        description: string | null;
        price: number;
        weight: number | null;
        image_url: string | null;
        category_name: string;
        company_id: number;
        company_name: string;
      }>;
      total: number;
      page: number;
      per_page: number;
      pages: number;
    }>(`/public/search?${qs}`);
  },
};

// ---------- Auth API ----------

export const authApi = {
  /** Register a new user */
  register(data: {
    email: string;
    password: string;
    full_name?: string;
    phone?: string;
    role?: "customer" | "owner" | "courier";
  }) {
    return apiFetch<{
      id: number;
      email: string;
      phone: string | null;
      full_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
    }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Login and get session cookie */
  login(email: string, password: string) {
    return apiFetch<{ message: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  /** Logout */
  logout() {
    return apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    });
  },

  /** Get current user info */
  getMe() {
    return apiFetch<{
      id: number;
      email: string;
      phone: string | null;
      full_name: string | null;
      role: string;
      is_active: boolean;
      created_at: string;
    }>("/auth/me");
  },
};

// ---------- Customer Orders API ----------

export const ordersApi = {
  /** Get customer's addresses */
  getAddresses() {
    return apiFetch<Array<{
      id: number;
      user_id: number;
      label: string | null;
      address: string;
      latitude: number;
      longitude: number;
      floor: string | null;
      apartment: string | null;
      entrance: string | null;
      comment: string | null;
      is_default: boolean;
    }>>("/orders/addresses");
  },

  /** Create a delivery address */
  createAddress(data: {
    address: string;
    latitude: number;
    longitude: number;
    label?: string;
    floor?: string;
    apartment?: string;
    entrance?: string;
    comment?: string;
    is_default?: boolean;
  }) {
    return apiFetch("/orders/addresses", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Create an order */
  createOrder(data: {
    company_id: number;
    delivery_address_id?: number;
    delivery_address?: string;
    delivery_latitude?: number;
    delivery_longitude?: number;
    delivery_comment?: string;
    items: Array<{ menu_item_id: number; quantity: number }>;
  }) {
    return apiFetch<BackendOrder>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Get customer's orders */
  getMyOrders(params?: { page?: number; per_page?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    return apiFetch<{
      items: BackendOrder[];
      total: number;
      page: number;
      per_page: number;
      pages: number;
    }>(`/orders?${qs}`);
  },

  /** Get single order details */
  getOrder(orderId: number) {
    return apiFetch<BackendOrder>(`/orders/${orderId}`);
  },

  /** Get order status history */
  getOrderStatus(orderId: number) {
    return apiFetch<{
      order_id: number;
      status: string;
      history: Array<{
        old_status: string | null;
        new_status: string;
        comment: string | null;
        created_at: string;
      }>;
    }>(`/orders/${orderId}/status`);
  },

  /** Cancel an order */
  cancelOrder(orderId: number, reason?: string) {
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : "";
    return apiFetch<{ message: string }>(`/orders/${orderId}/cancel${qs}`, {
      method: "DELETE",
    });
  },
};

// ---------- Courier API ----------

export const courierApi = {
  /** Register as a courier */
  register(data: {
    email: string;
    phone: string;
    password: string;
    full_name: string;
    vehicle_type?: string;
    vehicle_number?: string;
  }) {
    return apiFetch("/couriers/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /** Get courier profile */
  getProfile() {
    return apiFetch("/couriers/profile");
  },

  /** Start a shift */
  startShift() {
    return apiFetch("/couriers/shifts/start", { method: "POST" });
  },

  /** End a shift */
  endShift() {
    return apiFetch("/couriers/shifts/end", { method: "POST" });
  },

  /** Get available orders for courier */
  getAvailableOrders() {
    return apiFetch<Array<{
      id: number;
      company_name: string;
      pickup_address: string;
      distance_km: number | null;
      delivery_fee: number;
      total: number;
      status: string;
      created_at: string;
    }>>("/couriers/available-orders");
  },

  /** Accept an order */
  acceptOrder(orderId: number) {
    return apiFetch<{ message: string }>(
      `/couriers/orders/${orderId}/accept`,
      { method: "POST" }
    );
  },

  /** Get active order */
  getActiveOrder() {
    return apiFetch<BackendOrder>("/couriers/orders/active");
  },

  /** Update order status */
  updateOrderStatus(
    orderId: number,
    status: "picked_up" | "in_delivery" | "delivered",
    comment?: string
  ) {
    return apiFetch<{ message: string }>(
      `/couriers/orders/${orderId}/status`,
      {
        method: "POST",
        body: JSON.stringify({ status, comment }),
      }
    );
  },

  /** Get completed orders */
  getCompletedOrders(params?: { page?: number; per_page?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    return apiFetch<{ items: BackendOrder[]; total: number }>(
      `/couriers/orders/completed?${qs}`
    );
  },

  /** Update courier location */
  updateLocation(latitude: number, longitude: number) {
    return apiFetch<{ message: string }>(
      `/couriers/location?latitude=${latitude}&longitude=${longitude}`,
      { method: "POST" }
    );
  },

  /** Calculate ETA for an order */
  getETA(orderId: number) {
    return apiFetch<{
      order_id: number;
      restaurant: {
        name: string | null;
        address: string | null;
        distance_km: number | null;
        eta_minutes: number | null;
      };
      customer: {
        address: string;
        distance_km: number | null;
        eta_minutes: number | null;
      };
      total: {
        distance_km: number;
        eta_minutes: number;
      };
    }>(`/couriers/orders/${orderId}/eta`);
  },
};

// ---------- Owner API ----------

export const ownerApi = {
  /** Get orders for a company */
  getCompanyOrders(
    companyId: number,
    params?: { page?: number; per_page?: number; status_filter?: string }
  ) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.per_page) qs.set("per_page", String(params.per_page));
    if (params?.status_filter) qs.set("status_filter", params.status_filter);
    return apiFetch<{ items: BackendOrder[]; total: number }>(
      `/orders/company/${companyId}?${qs}`
    );
  },

  /** Confirm an order */
  confirmOrder(orderId: number) {
    return apiFetch<{ message: string }>(`/orders/${orderId}/confirm`, {
      method: "POST",
    });
  },

  /** Reject an order */
  rejectOrder(orderId: number, reason: string) {
    return apiFetch<{ message: string }>(
      `/orders/${orderId}/reject?reason=${encodeURIComponent(reason)}`,
      { method: "POST" }
    );
  },

  /** Mark order as ready for courier */
  readyForCourier(orderId: number) {
    return apiFetch<{ message: string }>(
      `/orders/${orderId}/ready-for-courier`,
      { method: "POST" }
    );
  },
};
