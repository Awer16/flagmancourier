// Adapters: Backend API types → Frontend types

import type {
  BackendCompany,
  BackendMenu,
  BackendMenuItem,
  BackendMenuCategory,
  BackendSalesPoint,
  BackendDeliveryZone,
} from "./api-client";
import type { Company, MenuItem } from "@/shared/types/customer";

/** Convert backend company + point + zones + menu → frontend Company */
export function companyToFrontend(
  backend: BackendCompany,
  point: BackendSalesPoint | null,
  zones: BackendDeliveryZone[],
  menu: BackendMenu | null
): Company {
  const lat = point?.latitude ?? 47.2357;
  const lon = point?.longitude ?? 39.7015;

  const etaMin =
    zones.length > 0
      ? Math.min(...zones.map((z) => z.estimated_delivery_minutes))
      : 30;

  // Determine cuisine from description or name
  const cuisine = backend.description
    ? backend.description.split(".")[0].split(",")[0]
    : "Разное";

  // Flatten menu items
  const menuItems: MenuItem[] = [];
  if (menu?.categories) {
    for (const cat of menu.categories) {
      if (cat.items) {
        for (const item of cat.items) {
          if (item.is_available) {
            menuItems.push(menuItemToFrontend(item, cat.name));
          }
        }
      }
    }
  }

  return {
    id: String(backend.id),
    name: backend.name,
    description: backend.description || "",
    lat,
    lon,
    address: point?.address || "",
    cuisine,
    deliveryEtaMin: etaMin,
    menu: menuItems,
    cityId: "rostov",
  };
}

/** Convert backend menu item → frontend MenuItem */
export function menuItemToFrontend(
  item: BackendMenuItem,
  categoryName: string
): MenuItem {
  return {
    id: String(item.id),
    name: item.name,
    price: item.price,
    description: item.description || undefined,
    category: categoryName,
    imageUrl: item.image_url || undefined,
    oldPrice: undefined,
  };
}

/** Convert backend company list item → minimal info for search results */
export function companyToSearchResult(backend: BackendCompany) {
  return {
    id: String(backend.id),
    name: backend.name,
    description: backend.description || "",
    menuItemsCount: backend.menu_items_count ?? 0,
    minPrice: backend.min_price ?? 0,
    categoriesCount: backend.categories_count ?? 0,
    logoUrl: backend.logo_url,
  };
}
