import type {
  HomeStoreCategory,
  HomeStoreWithCategory,
} from "@/shared/types/home-marketplace";

export const HOME_FEATURED_CATEGORIES: HomeStoreCategory[] = [
  {
    id: "fastfood",
    title: "Фастфуд",
    subtitle: "Быстро и сытно",
    stores: [
      {
        id: "ff-1",
        name: "Шаурма на углях",
        imageUrl:
          "https://placehold.co/360x200/fef3c7/92400e/png?text=Shaurma",
        deliveryEtaMin: 25,
        rating: 4.8,
      },
      {
        id: "ff-2",
        name: "Бургер Клаб",
        imageUrl:
          "https://placehold.co/360x200/fee2e2/991b1b/png?text=Burger",
        deliveryEtaMin: 30,
        rating: 4.6,
      },
      {
        id: "ff-3",
        name: "Крылья и картошка",
        imageUrl:
          "https://placehold.co/360x200/ffedd5/c2410c/png?text=Wings",
        deliveryEtaMin: 28,
        rating: 4.7,
      },
      {
        id: "ff-4",
        name: "Пицца за 25 минут",
        imageUrl:
          "https://placehold.co/360x200/fce7f3/9d174d/png?text=Pizza",
        deliveryEtaMin: 25,
        rating: 4.5,
      },
      {
        id: "ff-5",
        name: "Суши-бокс",
        imageUrl:
          "https://placehold.co/360x200/e0f2fe/075985/png?text=Sushi",
        deliveryEtaMin: 40,
        rating: 4.9,
      },
      {
        id: "ff-6",
        name: "Тако и буррито",
        imageUrl:
          "https://placehold.co/360x200/dcfce7/166534/png?text=Taco",
        deliveryEtaMin: 22,
        rating: 4.4,
      },
    ],
  },
  {
    id: "restaurants",
    title: "Рестораны",
    subtitle: "Кухня со всего мира",
    stores: [
      {
        id: "rs-1",
        name: "Итальянский дворик",
        imageUrl:
          "https://placehold.co/360x200/f3e8ff/6b21a8/png?text=Italian",
        deliveryEtaMin: 45,
        rating: 4.9,
      },
      {
        id: "rs-2",
        name: "Хинкальная «Тбилиси»",
        imageUrl:
          "https://placehold.co/360x200/fef9c3/a16207/png?text=Khinkali",
        deliveryEtaMin: 50,
        rating: 4.8,
      },
      {
        id: "rs-3",
        name: "Стейк-хаус Prime",
        imageUrl:
          "https://placehold.co/360x200/ffe4e6/9f1239/png?text=Steak",
        deliveryEtaMin: 55,
        rating: 4.7,
      },
      {
        id: "rs-4",
        name: "Рыба и море",
        imageUrl:
          "https://placehold.co/360x200/e0f2fe/0369a1/png?text=Seafood",
        deliveryEtaMin: 48,
        rating: 4.6,
      },
      {
        id: "rs-5",
        name: "Паназия",
        imageUrl:
          "https://placehold.co/360x200/ecfeff/0e7490/png?text=Asia",
        deliveryEtaMin: 42,
        rating: 4.5,
      },
    ],
  },
  {
    id: "electronics",
    title: "Электроника и техника",
    subtitle: "Гаджеты с доставкой",
    stores: [
      {
        id: "el-1",
        name: "ТехноПоинт",
        imageUrl:
          "https://placehold.co/360x200/e2e8f0/334155/png?text=Tech",
        deliveryEtaMin: 90,
        rating: 4.5,
      },
      {
        id: "el-2",
        name: "ГаджетПро",
        imageUrl:
          "https://placehold.co/360x200/f1f5f9/0f172a/png?text=Gadget",
        deliveryEtaMin: 120,
        rating: 4.3,
      },
      {
        id: "el-3",
        name: "Умный дом 24",
        imageUrl:
          "https://placehold.co/360x200/cffafe/155e75/png?text=Smart",
        deliveryEtaMin: 75,
        rating: 4.6,
      },
      {
        id: "el-4",
        name: "АудиоМир",
        imageUrl:
          "https://placehold.co/360x200/fae8ff/86198f/png?text=Audio",
        deliveryEtaMin: 100,
        rating: 4.4,
      },
    ],
  },
  {
    id: "diy",
    title: "Стройка и дом",
    subtitle: "Всё для ремонта",
    stores: [
      {
        id: "dy-1",
        name: "СтройДом Маркет",
        imageUrl:
          "https://placehold.co/360x200/e7e5e4/44403c/png?text=Build",
        deliveryEtaMin: 180,
        rating: 4.2,
      },
      {
        id: "dy-2",
        name: "Крепёж и инструмент",
        imageUrl:
          "https://placehold.co/360x200/d6d3d1/292524/png?text=Tools",
        deliveryEtaMin: 150,
        rating: 4.4,
      },
      {
        id: "dy-3",
        name: "Сад и огород",
        imageUrl:
          "https://placehold.co/360x200/dcfce7/14532d/png?text=Garden",
        deliveryEtaMin: 120,
        rating: 4.5,
      },
      {
        id: "dy-4",
        name: "Краски и обои",
        imageUrl:
          "https://placehold.co/360x200/fef3c7/b45309/png?text=Paint",
        deliveryEtaMin: 90,
        rating: 4.3,
      },
    ],
  },
  {
    id: "groceries",
    title: "Продукты",
    subtitle: "Свежие продукты рядом",
    stores: [
      {
        id: "gr-1",
        name: "У дома Маркет",
        imageUrl:
          "https://placehold.co/360x200/dcfce7/166534/png?text=Fresh",
        deliveryEtaMin: 35,
        rating: 4.8,
      },
      {
        id: "gr-2",
        name: "Пятница у дома",
        imageUrl:
          "https://placehold.co/360x200/fef2f2/b91c1c/png?text=Market",
        deliveryEtaMin: 30,
        rating: 4.5,
      },
      {
        id: "gr-3",
        name: "Овощи и фрукты",
        imageUrl:
          "https://placehold.co/360x200/ecfdf5/047857/png?text=Veggie",
        deliveryEtaMin: 25,
        rating: 4.7,
      },
      {
        id: "gr-4",
        name: "Молочная лавка",
        imageUrl:
          "https://placehold.co/360x200/f0f9ff/0369a1/png?text=Milk",
        deliveryEtaMin: 28,
        rating: 4.6,
      },
      {
        id: "gr-5",
        name: "Бакалея оптом",
        imageUrl:
          "https://placehold.co/360x200/fff7ed/c2410c/png?text=Grocery",
        deliveryEtaMin: 40,
        rating: 4.4,
      },
    ],
  },
  {
    id: "office-gifts",
    title: "Канцтовары и подарки",
    subtitle: "Офис и праздник",
    stores: [
      {
        id: "of-1",
        name: "ОфисМир",
        imageUrl:
          "https://placehold.co/360x200/e0e7ff/3730a3/png?text=Office",
        deliveryEtaMin: 60,
        rating: 4.5,
      },
      {
        id: "of-2",
        name: "КанцКласс",
        imageUrl:
          "https://placehold.co/360x200/fae8ff/7e22ce/png?text=Pens",
        deliveryEtaMin: 45,
        rating: 4.3,
      },
      {
        id: "of-3",
        name: "Цветы за час",
        imageUrl:
          "https://placehold.co/360x200/fce7f3/be185d/png?text=Flowers",
        deliveryEtaMin: 60,
        rating: 4.9,
      },
    ],
  },
  {
    id: "coffee",
    title: "Кофейни",
    subtitle: "Зерно, десерты, завтраки",
    stores: [
      {
        id: "cf-1",
        name: "Бруско кофе",
        imageUrl:
          "https://placehold.co/360x200/fef3c7/78350f/png?text=Coffee",
        deliveryEtaMin: 20,
        rating: 4.8,
      },
      {
        id: "cf-2",
        name: "Латте и точка",
        imageUrl:
          "https://placehold.co/360x200/fce7f3/9d174d/png?text=Latte",
        deliveryEtaMin: 18,
        rating: 4.7,
      },
    ],
  },
];

export function flattenFeaturedStores(): HomeStoreWithCategory[] {
  return HOME_FEATURED_CATEGORIES.flatMap((cat) =>
    cat.stores.map((store) => ({
      ...store,
      categoryId: cat.id,
      categoryTitle: cat.title,
    })),
  );
}

export function filterStoresByQuery(
  list: HomeStoreWithCategory[],
  query: string,
): HomeStoreWithCategory[] {
  const q = query.trim().toLocaleLowerCase("ru-RU");
  if (!q) {
    return [];
  }
  return list.filter(
    (s) =>
      s.name.toLocaleLowerCase("ru-RU").includes(q) ||
      s.categoryTitle.toLocaleLowerCase("ru-RU").includes(q),
  );
}
