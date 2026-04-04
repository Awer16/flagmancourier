import type { Company } from "@/shared/types/customer";
import { haversineKm } from "@/lib/geo";
import {
  getFeaturedAsCompanyById,
  getNearbyCompaniesFromFeatured,
} from "@/lib/home-featured-stores";

export const MOCK_COMPANIES: Company[] = [
  {
    id: "cafe-flagman",
    name: "Кафе «Флагман»",
    description: "Домашняя кухня и обеды с доставкой",
    lat: 55.751244,
    lon: 37.618423,
    address: "ул. Тверская, 10, Москва",
    cuisine: "Русская кухня",
    deliveryEtaMin: 35,
    cityId: "msk",
    menu: [
      {
        id: "cf-1",
        name: "Борщ с говядиной",
        price: 320,
        description: "350 мл, со сметаной",
        category: "Первое",
        oldPrice: 380,
        imageUrl:
          "https://placehold.co/400x280/fef2f2/991b1b/png?text=Borscht",
      },
      {
        id: "cf-2",
        name: "Котлета по-киевски",
        price: 420,
        description: "С пюре и овощами",
        category: "Второе",
        imageUrl:
          "https://placehold.co/400x280/fff7ed/c2410c/png?text=Cutlet",
      },
      {
        id: "cf-3",
        name: "Салат «Цезарь»",
        price: 380,
        category: "Салаты",
        oldPrice: 420,
        imageUrl:
          "https://placehold.co/400x280/ecfdf5/047857/png?text=Salad",
      },
      {
        id: "cf-4",
        name: "Морс брусничный",
        price: 120,
        category: "Напитки",
        imageUrl:
          "https://placehold.co/400x280/fce7f3/9d174d/png?text=Mors",
      },
      {
        id: "cf-5",
        name: "Суп-харчо",
        price: 340,
        description: "Острое, с говядиной",
        category: "Первое",
        imageUrl:
          "https://placehold.co/400x280/fef3c7/92400e/png?text=Kharcho",
      },
      {
        id: "cf-6",
        name: "Комбо «Обед»",
        price: 720,
        description: "Суп + второе + салат + напиток",
        category: "Комбо",
        oldPrice: 850,
        imageUrl:
          "https://placehold.co/400x280/e0e7ff/3730a3/png?text=Combo",
      },
    ],
  },
  {
    id: "pizza-nebo",
    name: "Пиццерия «Небо»",
    description: "Тонкое тесто, печь на дровах",
    lat: 55.753215,
    lon: 37.622482,
    address: "Никольская ул., 7, Москва",
    cuisine: "Итальянская",
    deliveryEtaMin: 40,
    cityId: "msk",
    menu: [
      {
        id: "pn-1",
        name: "Маргарита",
        price: 490,
        description: "Томаты, моцарелла, базилик",
        category: "Пицца",
        oldPrice: 560,
        imageUrl:
          "https://placehold.co/400x280/fce7f3/9d174d/png?text=Margarita",
      },
      {
        id: "pn-2",
        name: "Пепперони",
        price: 590,
        description: "Острые колбаски, сыр",
        category: "Пицца",
        imageUrl:
          "https://placehold.co/400x280/fee2e2/991b1b/png?text=Pepperoni",
      },
      {
        id: "pn-3",
        name: "Четыре сыра",
        price: 650,
        category: "Пицца",
        oldPrice: 720,
        imageUrl:
          "https://placehold.co/400x280/fef9c3/a16207/png?text=4+Cheese",
      },
      {
        id: "pn-4",
        name: "Тирамису",
        price: 290,
        category: "Десерты",
        imageUrl:
          "https://placehold.co/400x280/f3e8ff/6b21a8/png?text=Tiramisu",
      },
      {
        id: "pn-5",
        name: "Карбонара 32 см",
        price: 640,
        description: "Бекон, сливки, пармезан",
        category: "Пицца",
        imageUrl:
          "https://placehold.co/400x280/ecfeff/0e7490/png?text=Carbonara",
      },
    ],
  },
];

const NEARBY_MAX_KM = 18;

export function getCompanyById(id: string): Company | undefined {
  return (
    MOCK_COMPANIES.find((c) => c.id === id) ?? getFeaturedAsCompanyById(id)
  );
}

export function getAllNearbyCompanies(
  userLat: number,
  userLon: number,
  userCityId: string,
  maxKm: number = NEARBY_MAX_KM,
): Company[] {
  const fromMock = MOCK_COMPANIES.filter(
    (c) =>
      c.cityId === userCityId &&
      haversineKm(userLat, userLon, c.lat, c.lon) <= maxKm,
  );
  const fromFeatured = getNearbyCompaniesFromFeatured(
    userLat,
    userLon,
    userCityId,
    maxKm,
  );
  const byId = new Map<string, Company>();
  for (const c of fromMock) {
    byId.set(c.id, c);
  }
  for (const c of fromFeatured) {
    byId.set(c.id, c);
  }
  return [...byId.values()].sort(
    (a, b) =>
      haversineKm(userLat, userLon, a.lat, a.lon) -
      haversineKm(userLat, userLon, b.lat, b.lon),
  );
}
