import type { Company } from "@/shared/types/customer";

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
    menu: [
      {
        id: "cf-1",
        name: "Борщ с говядиной",
        price: 320,
        description: "350 мл, со сметаной",
        category: "Первое",
      },
      {
        id: "cf-2",
        name: "Котлета по-киевски",
        price: 420,
        description: "С пюре и овощами",
        category: "Второе",
      },
      {
        id: "cf-3",
        name: "Салат «Цезарь»",
        price: 380,
        category: "Салаты",
      },
      {
        id: "cf-4",
        name: "Морс брусничный",
        price: 120,
        category: "Напитки",
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
    menu: [
      {
        id: "pn-1",
        name: "Маргарита",
        price: 490,
        description: "Томаты, моцарелла, базилик",
        category: "Пицца",
      },
      {
        id: "pn-2",
        name: "Пепперони",
        price: 590,
        description: "Острые колбаски, сыр",
        category: "Пицца",
      },
      {
        id: "pn-3",
        name: "Четыре сыра",
        price: 650,
        category: "Пицца",
      },
      {
        id: "pn-4",
        name: "Тирамису",
        price: 290,
        category: "Десерты",
      },
    ],
  },
];

export function getCompanyById(id: string): Company | undefined {
  return MOCK_COMPANIES.find((c) => c.id === id);
}
