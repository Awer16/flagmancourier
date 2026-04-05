// Adapters: Backend API types → Frontend types

import type { BackendCompany, BackendMenuItem } from "./api-client";
import type { Company, MenuItem } from "@/shared/types/customer";

/** Convert backend company → frontend Company */
export function companyToFrontend(
  backend: BackendCompany,
  menuItems: BackendMenuItem[] = []
): Company {
  const lat = parseFloat(backend.latitude) || 47.2357;
  const lon = parseFloat(backend.longitude) || 39.7015;

  const frontendMenu: MenuItem[] = menuItems
    .filter((item) => item.is_available && item.moderation_status === "approved")
    .map((item) => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      description: item.description || undefined,
      category: item.category,
      imageUrl: item.image_url || undefined,
      oldPrice: undefined,
    }));

  return {
    id: backend.id,
    slug: backend.slug || undefined,
    name: backend.name,
    description: backend.description || "",
    lat,
    lon,
    address: backend.address || "",
    cuisine: "Разное",
    deliveryEtaMin: 30,
    menu: frontendMenu,
    cityId: "rostov",
  };
}

/** Convert backend menu item → frontend MenuItem */
export function menuItemToFrontend(item: BackendMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    price: parseFloat(item.price),
    description: item.description || undefined,
    category: item.category,
    imageUrl: item.image_url || undefined,
    oldPrice: item.old_price ? parseFloat(item.old_price) : undefined,
  };
}

/** Convert backend company → search result */
export function companyToSearchResult(backend: BackendCompany) {
  return {
    id: backend.id,
    name: backend.name,
    description: backend.description || "",
    logoUrl: backend.logo_url,
  };
}
