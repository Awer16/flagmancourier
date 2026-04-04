import type { MenuItem } from "@/shared/types/customer";

function m(
  storeId: string,
  suffix: string,
  name: string,
  price: number,
  category: string,
  opts?: { description?: string; oldPrice?: number; imageUrl?: string },
): MenuItem {
  return {
    id: `${storeId}-${suffix}`,
    name,
    price,
    category,
    description: opts?.description,
    oldPrice: opts?.oldPrice,
    imageUrl: opts?.imageUrl,
  };
}

const IMG = {
  shaurma:
    "https://placehold.co/400x280/fef3c7/92400e/png?text=Shaurma",
  burger:
    "https://placehold.co/400x280/fee2e2/991b1b/png?text=Burger",
  wings:
    "https://placehold.co/400x280/ffedd5/c2410c/png?text=Wings",
  pizza:
    "https://placehold.co/400x280/fce7f3/9d174d/png?text=Pizza",
  sushi:
    "https://placehold.co/400x280/e0f2fe/075985/png?text=Sushi",
  taco:
    "https://placehold.co/400x280/dcfce7/166534/png?text=Taco",
  italian:
    "https://placehold.co/400x280/f3e8ff/6b21a8/png?text=Pasta",
  khinkali:
    "https://placehold.co/400x280/fef9c3/a16207/png?text=Khinkali",
  steak:
    "https://placehold.co/400x280/ffe4e6/9f1239/png?text=Steak",
  fish:
    "https://placehold.co/400x280/e0f2fe/0369a1/png?text=Fish",
  asia:
    "https://placehold.co/400x280/ecfeff/0e7490/png?text=Wok",
  tech:
    "https://placehold.co/400x280/e2e8f0/334155/png?text=Tech",
  gadget:
    "https://placehold.co/400x280/f1f5f9/0f172a/png?text=Gadget",
  smart:
    "https://placehold.co/400x280/cffafe/155e75/png?text=IoT",
  audio:
    "https://placehold.co/400x280/fae8ff/86198f/png?text=Audio",
  build:
    "https://placehold.co/400x280/e7e5e4/44403c/png?text=DIY",
  tools:
    "https://placehold.co/400x280/d6d3d1/292524/png?text=Tools",
  garden:
    "https://placehold.co/400x280/dcfce7/14532d/png?text=Garden",
  paint:
    "https://placehold.co/400x280/fef3c7/b45309/png?text=Paint",
  fresh:
    "https://placehold.co/400x280/dcfce7/166534/png?text=Fresh",
  market:
    "https://placehold.co/400x280/fef2f2/b91c1c/png?text=Market",
  veggie:
    "https://placehold.co/400x280/ecfdf5/047857/png?text=Veggie",
  milk:
    "https://placehold.co/400x280/f0f9ff/0369a1/png?text=Milk",
  grocery:
    "https://placehold.co/400x280/fff7ed/c2410c/png?text=Bulk",
  office:
    "https://placehold.co/400x280/e0e7ff/3730a3/png?text=Office",
  pens:
    "https://placehold.co/400x280/fae8ff/7e22ce/png?text=Pens",
  flowers:
    "https://placehold.co/400x280/fce7f3/be185d/png?text=Flowers",
  coffee:
    "https://placehold.co/400x280/fef3c7/78350f/png?text=Coffee",
  latte:
    "https://placehold.co/400x280/fce7f3/9d174d/png?text=Latte",
  donShash:
    "https://placehold.co/400x280/fed7aa/c2410c/png?text=Shashlik",
  donPel:
    "https://placehold.co/400x280/e0e7ff/1e3a8a/png?text=Pelmeni",
} as const;

const FEATURED_MENUS: Record<string, MenuItem[]> = {
  "ff-1": [
    m("ff-1", "s1", "Шаурма курица классика", 250, "Шаурма", {
      description: "Лаваш, овощи, соус белый",
      oldPrice: 320,
      imageUrl: IMG.shaurma,
    }),
    m("ff-1", "s2", "Шаурма говядина", 290, "Шаурма", {
      description: "Маринованное мясо на углях",
      imageUrl: IMG.shaurma,
    }),
    m("ff-1", "s3", "Острая шаурма", 270, "Шаурма", {
      description: "Чили и халапеньо",
      oldPrice: 310,
      imageUrl: IMG.shaurma,
    }),
    m("ff-1", "s4", "Картофель фри", 150, "Гарниры", { imageUrl: IMG.wings }),
    m("ff-1", "s5", "Айран 0,4 л", 90, "Напитки"),
    m("ff-1", "s6", "Комбо «Ужин»", 520, "Комбо", {
      description: "Шаурма + фри + напиток",
      oldPrice: 620,
      imageUrl: IMG.shaurma,
    }),
  ],
  "ff-2": [
    m("ff-2", "b1", "Чизбургер", 390, "Бургеры", {
      description: "Говядина, чеддер, маринованные огурцы",
      oldPrice: 460,
      imageUrl: IMG.burger,
    }),
    m("ff-2", "b2", "Двойной бургер", 520, "Бургеры", {
      description: "Две котлеты, бекон",
      imageUrl: IMG.burger,
    }),
    m("ff-2", "b3", "Чикен-бургер", 350, "Бургеры", {
      oldPrice: 410,
      imageUrl: IMG.burger,
    }),
    m("ff-2", "b4", "Нагетсы 6 шт.", 220, "Закуски", { imageUrl: IMG.wings }),
    m("ff-2", "b5", "Картофель по-деревенски", 180, "Гарниры"),
    m("ff-2", "b6", "Молочный коктейль", 210, "Напитки", { imageUrl: IMG.latte }),
  ],
  "ff-3": [
    m("ff-3", "w1", "Крылья BBQ 8 шт.", 420, "Крылья", {
      description: "Дымный соус",
      oldPrice: 490,
      imageUrl: IMG.wings,
    }),
    m("ff-3", "w2", "Острые крылья", 430, "Крылья", { imageUrl: IMG.wings }),
    m("ff-3", "w3", "Картофель фри большой", 190, "Гарниры", {
      oldPrice: 240,
      imageUrl: IMG.wings,
    }),
    m("ff-3", "w4", "Стрипсы 5 шт.", 310, "Курица", { imageUrl: IMG.wings }),
    m("ff-3", "w5", "Соус на выбор", 60, "Соусы"),
  ],
  "ff-4": [
    m("ff-4", "p1", "Маргарита 30 см", 490, "Пицца", {
      description: "Томаты, моцарелла",
      oldPrice: 560,
      imageUrl: IMG.pizza,
    }),
    m("ff-4", "p2", "Пепперони 30 см", 590, "Пицца", { imageUrl: IMG.pizza }),
    m("ff-4", "p3", "Четыре сыра", 650, "Пицца", {
      oldPrice: 720,
      imageUrl: IMG.pizza,
    }),
    m("ff-4", "p4", "Карбонара 30 см", 620, "Пицца", { imageUrl: IMG.pizza }),
    m("ff-4", "p5", "Чесночные гренки", 180, "Закуски"),
    m("ff-4", "p6", "Сок 1 л", 150, "Напитки"),
  ],
  "ff-5": [
    m("ff-5", "su1", "Филадельфия 8 шт.", 520, "Роллы", {
      oldPrice: 590,
      imageUrl: IMG.sushi,
    }),
    m("ff-5", "su2", "Калифорния с крабом", 480, "Роллы", {
      imageUrl: IMG.sushi,
    }),
    m("ff-5", "su3", "Сет «Любитель»", 890, "Сеты", {
      description: "24 кусочка, микс",
      oldPrice: 1050,
      imageUrl: IMG.sushi,
    }),
    m("ff-5", "su4", "Мисо-суп", 160, "Супы"),
    m("ff-5", "su5", "Салат с чукой", 220, "Салаты", { imageUrl: IMG.asia }),
    m("ff-5", "su6", "Зелёный чай", 120, "Напитки"),
  ],
  "ff-6": [
    m("ff-6", "t1", "Тако с говядиной 2 шт.", 320, "Тако", {
      oldPrice: 380,
      imageUrl: IMG.taco,
    }),
    m("ff-6", "t2", "Буррито чикен", 410, "Буррито", { imageUrl: IMG.taco }),
    m("ff-6", "t3", "Начос с сыром", 290, "Закуски", {
      imageUrl: IMG.taco,
    }),
    m("ff-6", "t4", "Гуакамоле", 180, "Закуски"),
    m("ff-6", "t5", "Агава-лимонад", 150, "Напитки", { oldPrice: 190 }),
  ],
  "rs-1": [
    m("rs-1", "i1", "Карбонара", 520, "Паста", {
      description: "Пармезан, бекон",
      oldPrice: 590,
      imageUrl: IMG.italian,
    }),
    m("rs-1", "i2", "Болоньезе", 480, "Паста", { imageUrl: IMG.italian }),
    m("rs-1", "i3", "Ризотто с грибами", 450, "Рис", { imageUrl: IMG.italian }),
    m("rs-1", "i4", "Капрезе", 380, "Салаты", { imageUrl: IMG.italian }),
    m("rs-1", "i5", "Тирамису", 290, "Десерты"),
    m("rs-1", "i6", "Домашнее вино 0,75", 890, "Напитки"),
  ],
  "rs-2": [
    m("rs-2", "h1", "Хинкали говядина 5 шт.", 380, "Хинкали", {
      oldPrice: 440,
      imageUrl: IMG.khinkali,
    }),
    m("rs-2", "h2", "Хинкали сырные 5 шт.", 360, "Хинкали", {
      imageUrl: IMG.khinkali,
    }),
    m("rs-2", "h3", "Хачапури по-аджарски", 520, "Выпечка", {
      description: "Яйцо, масло",
      oldPrice: 580,
      imageUrl: IMG.khinkali,
    }),
    m("rs-2", "h4", "Лобио", 240, "Закуски"),
    m("rs-2", "h5", "Чача 50 мл", 180, "Напитки"),
  ],
  "rs-3": [
    m("rs-3", "st1", "Рибай 250 г", 1890, "Стейки", {
      description: "Средняя прожарка",
      oldPrice: 2190,
      imageUrl: IMG.steak,
    }),
    m("rs-3", "st2", "Стриплойн", 1290, "Стейки", { imageUrl: IMG.steak }),
    m("rs-3", "st3", "Бургер из мраморной говядины", 690, "Бургеры", {
      imageUrl: IMG.steak,
    }),
    m("rs-3", "st4", "Запечённый картофель", 220, "Гарниры"),
    m("rs-3", "st5", "Красное вино бокал", 420, "Напитки"),
  ],
  "rs-4": [
    m("rs-4", "f1", "Лосось на гриле", 720, "Рыба", {
      oldPrice: 820,
      imageUrl: IMG.fish,
    }),
    m("rs-4", "f2", "Мидии в сливках", 650, "Морепродукты", {
      imageUrl: IMG.fish,
    }),
    m("rs-4", "f3", "Устрицы 6 шт.", 980, "Морепродукты"),
    m("rs-4", "f4", "Севиче из креветки", 540, "Закуски", {
      oldPrice: 620,
      imageUrl: IMG.fish,
    }),
    m("rs-4", "f5", "Имбирный лимонад", 180, "Напитки"),
  ],
  "rs-5": [
    m("rs-5", "a1", "Пад тай с курицей", 420, "Wok", {
      oldPrice: 480,
      imageUrl: IMG.asia,
    }),
    m("rs-5", "a2", "Рамен острый", 390, "Супы", { imageUrl: IMG.asia }),
    m("rs-5", "a3", "Спринг-роллы 6 шт.", 310, "Закуски", { imageUrl: IMG.asia }),
    m("rs-5", "a4", "Бао с уткой 2 шт.", 360, "Закуски"),
    m("rs-5", "a5", "Манго-стики", 220, "Десерты"),
    m("rs-5", "a6", "Матча латте", 240, "Напитки", { imageUrl: IMG.latte }),
  ],
  "el-1": [
    m("el-1", "e1", "Наушники TWS", 3490, "Аудио", {
      oldPrice: 4290,
      imageUrl: IMG.tech,
    }),
    m("el-1", "e2", "Powerbank 20000 мА·ч", 2190, "Аксессуары", {
      imageUrl: IMG.gadget,
    }),
    m("el-1", "e3", "Защитное стекло универсальное", 490, "Аксессуары"),
    m("el-1", "e4", "USB-C кабель 2 м", 690, "Кабели", { oldPrice: 890 }),
    m("el-1", "e5", "Док-станция", 1590, "Периферия", { imageUrl: IMG.tech }),
  ],
  "el-2": [
    m("el-2", "g1", "Умные часы", 8990, "Носимая электроника", {
      oldPrice: 10990,
      imageUrl: IMG.gadget,
    }),
    m("el-2", "g2", "Кольцо-камера", 1290, "Аксессуары"),
    m("el-2", "g3", "Стабилизатор для смартфона", 5490, "Съёмка", {
      imageUrl: IMG.gadget,
    }),
    m("el-2", "g4", "Подсветка для стрима", 2490, "Студия"),
  ],
  "el-3": [
    m("el-3", "sm1", "Умная лампа RGB", 1890, "Освещение", {
      oldPrice: 2390,
      imageUrl: IMG.smart,
    }),
    m("el-3", "sm2", "Датчик движения Zigbee", 1290, "Датчики", {
      imageUrl: IMG.smart,
    }),
    m("el-3", "sm3", "Розетка с таймером", 890, "Электрика"),
    m("el-3", "sm4", "Хаб умного дома", 4990, "Хабы", { imageUrl: IMG.smart }),
  ],
  "el-4": [
    m("el-4", "au1", "Портативная колонка", 4290, "Колонки", {
      oldPrice: 5290,
      imageUrl: IMG.audio,
    }),
    m("el-4", "au2", "Вакуумные наушники", 6290, "Наушники", {
      imageUrl: IMG.audio,
    }),
    m("el-4", "au3", "Микрофон USB", 3190, "Студия"),
    m("el-4", "au4", "RCA-кабель 1,5 м", 590, "Кабели"),
  ],
  "dy-1": [
    m("dy-1", "d1", "Цемент М500 50 кг", 420, "Стройматериалы", {
      oldPrice: 480,
      imageUrl: IMG.build,
    }),
    m("dy-1", "d2", "Песок строительный мешок", 180, "Сыпучие"),
    m("dy-1", "d3", "Кирпич полнотелый", 28, "Кирпич", {
      description: "за шт.",
      imageUrl: IMG.build,
    }),
    m("dy-1", "d4", "Профиль гипсокартона 3 м", 290, "ГКЛ"),
  ],
  "dy-2": [
    m("dy-2", "t1", "Набор отвёрток 32 предм.", 1290, "Инструмент", {
      oldPrice: 1590,
      imageUrl: IMG.tools,
    }),
    m("dy-2", "t2", "Дрель-шуруповёрт", 4990, "Электроинструмент", {
      imageUrl: IMG.tools,
    }),
    m("dy-2", "t3", "Саморезы 200 шт.", 320, "Крепёж"),
    m("dy-2", "t4", "Дюбели универсальные", 190, "Крепёж"),
  ],
  "dy-3": [
    m("dy-3", "ga1", "Торф 50 л", 350, "Грунт", { imageUrl: IMG.garden }),
    m("dy-3", "ga2", "Лейка 10 л", 420, "Инвентарь", { oldPrice: 520 }),
    m("dy-3", "ga3", "Семена томатов микс", 180, "Семена"),
    m("dy-3", "ga4", "Горшки пластик набор 3 шт.", 390, "Товары для сада"),
  ],
  "dy-4": [
    m("dy-4", "pa1", "Краска интерьерная 9 л", 2890, "Краски", {
      oldPrice: 3390,
      imageUrl: IMG.paint,
    }),
    m("dy-4", "pa2", "Грунтовка 5 л", 890, "Грунты"),
    m("dy-4", "pa3", "Валик с ручкой", 450, "Инструмент"),
    m("dy-4", "pa4", "Обои винил 1 рулон", 1290, "Обои", {
      imageUrl: IMG.paint,
    }),
  ],
  "gr-1": [
    m("gr-1", "gr1", "Молоко 3,2% 1 л", 99, "Молочка", {
      oldPrice: 119,
      imageUrl: IMG.milk,
    }),
    m("gr-1", "gr2", "Хлеб деревенский", 65, "Выпечка", { imageUrl: IMG.fresh }),
    m("gr-1", "gr3", "Яйца С1 10 шт.", 140, "Молочка"),
    m("gr-1", "gr4", "Курица охлаждённая 1 кг", 420, "Мясо", {
      imageUrl: IMG.fresh,
    }),
    m("gr-1", "gr5", "Бананы 1 кг", 120, "Фрукты", { imageUrl: IMG.veggie }),
  ],
  "gr-2": [
    m("gr-2", "grm1", "Набор «Ужин»", 890, "Наборы", {
      description: "Мясо, гарнир, салат",
      oldPrice: 1050,
      imageUrl: IMG.market,
    }),
    m("gr-2", "grm2", "Пельмени домашние 800 г", 320, "Заморозка"),
    m("gr-2", "grm3", "Сыр Российский", 480, "Молочка"),
    m("gr-2", "grm4", "Вода 6×1,5 л", 390, "Напитки"),
  ],
  "gr-3": [
    m("gr-3", "v1", "Помидоры черри 250 г", 180, "Овощи", {
      oldPrice: 220,
      imageUrl: IMG.veggie,
    }),
    m("gr-3", "v2", "Огурцы тепличные 1 кг", 210, "Овощи", { imageUrl: IMG.veggie }),
    m("gr-3", "v3", "Салат микс", 150, "Зелень"),
    m("gr-3", "v4", "Яблоки сезон 1 кг", 160, "Фрукты", { imageUrl: IMG.veggie }),
  ],
  "gr-4": [
    m("gr-4", "m1", "Творог 9% 400 г", 180, "Молочка", {
      oldPrice: 210,
      imageUrl: IMG.milk,
    }),
    m("gr-4", "m2", "Сметана 20% 300 г", 150, "Молочка"),
    m("gr-4", "m3", "Масло сливочное", 220, "Молочка", { imageUrl: IMG.milk }),
    m("gr-4", "m4", "Йогурт греческий 4 шт.", 320, "Молочка"),
  ],
  "gr-5": [
    m("gr-5", "b1", "Гречка 5 кг", 890, "Бакалея", {
      oldPrice: 990,
      imageUrl: IMG.grocery,
    }),
    m("gr-5", "b2", "Масло подсолнечное 5 л", 720, "Бакалея"),
    m("gr-5", "b3", "Сахар-песок 1 кг", 89, "Бакалея"),
    m("gr-5", "b4", "Чай чёрный 100 пак.", 290, "Бакалея"),
  ],
  "of-1": [
    m("of-1", "o1", "Бумага А4 500 л.", 420, "Бумага", {
      oldPrice: 490,
      imageUrl: IMG.office,
    }),
    m("of-1", "o2", "Набор ручек 12 шт.", 310, "Письменные принадлежности"),
    m("of-1", "o3", "Степлер + скобы", 390, "Организация", { imageUrl: IMG.office }),
    m("of-1", "o4", "Папка-регистратор", 180, "Хранение"),
  ],
  "of-2": [
    m("of-2", "k1", "Тетради 48 л. набор 5 шт.", 250, "Школа", {
      imageUrl: IMG.pens,
    }),
    m("of-2", "k2", "Карандаши цветные 24 цв.", 420, "Творчество", {
      oldPrice: 490,
      imageUrl: IMG.pens,
    }),
    m("of-2", "k3", "Линейка металл 30 см", 120, "Черчение"),
  ],
  "of-3": [
    m("of-3", "fl1", "Букет «Рассвет»", 2490, "Букеты", {
      oldPrice: 2890,
      imageUrl: IMG.flowers,
    }),
    m("of-3", "fl2", "Розы 15 шт.", 1890, "Букеты", { imageUrl: IMG.flowers }),
    m("of-3", "fl3", "Комнатный фикус", 1590, "Комнатные растения"),
    m("of-3", "fl4", "Открытка + конверт", 90, "Аксессуары"),
  ],
  "cf-1": [
    m("cf-1", "c1", "Эспрессо двойной", 180, "Кофе", {
      oldPrice: 220,
      imageUrl: IMG.coffee,
    }),
    m("cf-1", "c2", "Капучино 300 мл", 220, "Кофе", { imageUrl: IMG.coffee }),
    m("cf-1", "c3", "Флэт уайт", 240, "Кофе", { imageUrl: IMG.latte }),
    m("cf-1", "c4", "Круассан масляный", 190, "Выпечка", {
      oldPrice: 230,
      imageUrl: IMG.coffee,
    }),
    m("cf-1", "c5", "Чизкейк", 290, "Десерты"),
  ],
  "cf-2": [
    m("cf-2", "l1", "Раф карамель", 260, "Авторский кофе", {
      oldPrice: 300,
      imageUrl: IMG.latte,
    }),
    m("cf-2", "l2", "Матча латте", 280, "Альтернатива", { imageUrl: IMG.latte }),
    m("cf-2", "l3", "Бабл-ти манго", 240, "Холодные напитки"),
    m("cf-2", "l4", "Сырник запечённый", 220, "Десерты"),
  ],
  "rnd-don-1": [
    m("rnd-don-1", "r1", "Шашлык из свинины 200 г", 420, "Шашлык", {
      description: "Лук, лаваш в комплекте",
      oldPrice: 490,
      imageUrl: IMG.donShash,
    }),
    m("rnd-don-1", "r2", "Люля-кебаб баранина", 450, "Шашлык", {
      imageUrl: IMG.donShash,
    }),
    m("rnd-don-1", "r3", "Овощи на гриле", 280, "Гарниры"),
    m("rnd-don-1", "r4", "Лепёшка тандырная", 90, "Выпечка", {
      oldPrice: 110,
      imageUrl: IMG.donShash,
    }),
    m("rnd-don-1", "r5", "Компот домашний 0,5 л", 120, "Напитки"),
  ],
  "rnd-don-2": [
    m("rnd-don-2", "p1", "Пельмени говядина 400 г", 320, "Пельмени", {
      oldPrice: 380,
      imageUrl: IMG.donPel,
    }),
    m("rnd-don-2", "p2", "Вареники с вишней 400 г", 290, "Вареники", {
      imageUrl: IMG.donPel,
    }),
    m("rnd-don-2", "p3", "Борщ с салом", 280, "Первое", {
      description: "350 мл",
      imageUrl: IMG.donPel,
    }),
    m("rnd-don-2", "p4", "Сало с чесноком 150 г", 240, "Закуски", {
      oldPrice: 280,
    }),
    m("rnd-don-2", "p5", "Квас 0,5 л", 100, "Напитки"),
  ],
};

function stubMenuForFeaturedStore(storeId: string): MenuItem[] {
  return [
    m(storeId, "m1", "Популярная позиция", 390, "Хиты", {
      description: "Стандартная порция",
    }),
    m(storeId, "m2", "Набор на двоих", 720, "Сеты"),
    m(storeId, "m3", "Напиток 0,5 л", 150, "Напитки"),
  ];
}

export function menuForFeaturedStoreId(storeId: string): MenuItem[] {
  return FEATURED_MENUS[storeId] ?? stubMenuForFeaturedStore(storeId);
}
