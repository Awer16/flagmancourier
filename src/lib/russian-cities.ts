export interface CityOption {
  id: string;
  name: string;
  lat: number;
  lon: number;
  zoom: number;
}

const Z = 12;

export const RUSSIAN_CITIES: CityOption[] = [
  { id: "msk", name: "Москва", lat: 55.7522, lon: 37.6156, zoom: Z },
  { id: "spb", name: "Санкт-Петербург", lat: 59.9343, lon: 30.3351, zoom: Z },
  { id: "nsk", name: "Новосибирск", lat: 55.0084, lon: 82.9357, zoom: Z },
  { id: "ekb", name: "Екатеринбург", lat: 56.8389, lon: 60.6057, zoom: Z },
  { id: "kzn", name: "Казань", lat: 55.7887, lon: 49.1221, zoom: Z },
  { id: "nnv", name: "Нижний Новгород", lat: 56.2965, lon: 43.9361, zoom: Z },
  { id: "chl", name: "Челябинск", lat: 55.1644, lon: 61.4368, zoom: Z },
  { id: "sam", name: "Самара", lat: 53.2001, lon: 50.15, zoom: Z },
  { id: "omsk", name: "Омск", lat: 54.9885, lon: 73.3242, zoom: Z },
  { id: "rnd", name: "Ростов-на-Дону", lat: 47.2357, lon: 39.7015, zoom: Z },
  { id: "ufa", name: "Уфа", lat: 54.7388, lon: 55.9721, zoom: Z },
  { id: "kras", name: "Красноярск", lat: 56.0153, lon: 92.8932, zoom: Z },
  { id: "vor", name: "Воронеж", lat: 51.672, lon: 39.1843, zoom: Z },
  { id: "perm", name: "Пермь", lat: 58.0105, lon: 56.2502, zoom: Z },
  { id: "vlg", name: "Волгоград", lat: 48.7194, lon: 44.5018, zoom: Z },
  { id: "krd", name: "Краснодар", lat: 45.0355, lon: 38.9753, zoom: Z },
  { id: "srt", name: "Саратов", lat: 51.5336, lon: 46.0342, zoom: Z },
  { id: "tym", name: "Тюмень", lat: 57.1522, lon: 65.5272, zoom: Z },
  { id: "tlt", name: "Тольятти", lat: 53.5303, lon: 49.3461, zoom: Z },
  { id: "izh", name: "Ижевск", lat: 56.8528, lon: 53.2115, zoom: Z },
  { id: "brn", name: "Барнаул", lat: 53.3606, lon: 83.7636, zoom: Z },
  { id: "uly", name: "Ульяновск", lat: 54.3142, lon: 48.4031, zoom: Z },
  { id: "irk", name: "Иркутск", lat: 52.2864, lon: 104.2807, zoom: Z },
  { id: "khb", name: "Хабаровск", lat: 48.4827, lon: 135.084, zoom: Z },
  { id: "yar", name: "Ярославль", lat: 57.6261, lon: 39.8845, zoom: Z },
  { id: "vvo", name: "Владивосток", lat: 43.1155, lon: 131.8855, zoom: Z },
  { id: "makh", name: "Махачкала", lat: 42.9849, lon: 47.5047, zoom: Z },
  { id: "tmk", name: "Томск", lat: 56.4846, lon: 84.9482, zoom: Z },
  { id: "orb", name: "Оренбург", lat: 51.7681, lon: 55.097, zoom: Z },
  { id: "kem", name: "Кемерово", lat: 55.3333, lon: 86.0833, zoom: Z },
  { id: "nkz", name: "Новокузнецк", lat: 53.7596, lon: 87.1216, zoom: Z },
  { id: "rzn", name: "Рязань", lat: 54.6269, lon: 39.6916, zoom: Z },
  { id: "astr", name: "Астрахань", lat: 46.3497, lon: 48.0408, zoom: Z },
  { id: "nch", name: "Набережные Челны", lat: 55.7436, lon: 52.3958, zoom: Z },
  { id: "pen", name: "Пенза", lat: 53.2007, lon: 45.0046, zoom: Z },
  { id: "lip", name: "Липецк", lat: 52.6088, lon: 39.5992, zoom: Z },
  { id: "kir", name: "Киров", lat: 58.6036, lon: 49.668, zoom: Z },
  { id: "cheb", name: "Чебоксары", lat: 56.1439, lon: 47.2489, zoom: Z },
  { id: "kgd", name: "Калининград", lat: 54.7104, lon: 20.4522, zoom: Z },
  { id: "tul", name: "Тула", lat: 54.1931, lon: 37.6173, zoom: Z },
  { id: "krs", name: "Курск", lat: 51.7304, lon: 36.1939, zoom: Z },
  { id: "soc", name: "Сочи", lat: 43.6028, lon: 39.7342, zoom: Z },
  { id: "stv", name: "Ставрополь", lat: 45.0428, lon: 41.9734, zoom: Z },
  { id: "ulan", name: "Улан-Уде", lat: 51.8272, lon: 107.6063, zoom: Z },
  { id: "mag", name: "Магнитогорск", lat: 53.4072, lon: 59.0457, zoom: Z },
  { id: "tvr", name: "Тверь", lat: 56.8587, lon: 35.9176, zoom: Z },
  { id: "ivn", name: "Иваново", lat: 57.0004, lon: 40.9739, zoom: Z },
  { id: "bry", name: "Брянск", lat: 53.2434, lon: 34.3654, zoom: Z },
  { id: "blg", name: "Белгород", lat: 50.5951, lon: 36.5873, zoom: Z },
  { id: "sug", name: "Сургут", lat: 61.2539, lon: 73.3962, zoom: Z },
  { id: "vlm", name: "Владимир", lat: 56.1291, lon: 40.4069, zoom: Z },
  { id: "ark", name: "Архангельск", lat: 64.5401, lon: 40.5433, zoom: Z },
  { id: "chita", name: "Чита", lat: 52.0339, lon: 113.4994, zoom: Z },
  { id: "klg", name: "Калуга", lat: 54.5293, lon: 36.2754, zoom: Z },
  { id: "sml", name: "Смоленск", lat: 54.7826, lon: 32.0451, zoom: Z },
  { id: "kgn", name: "Курган", lat: 55.441, lon: 65.3411, zoom: Z },
  { id: "orl", name: "Орёл", lat: 52.9651, lon: 36.0785, zoom: Z },
  { id: "sar", name: "Саранск", lat: 54.1838, lon: 45.1749, zoom: Z },
  { id: "ykt", name: "Якутск", lat: 62.0355, lon: 129.6755, zoom: Z },
  { id: "mum", name: "Мурманск", lat: 68.9585, lon: 33.0827, zoom: Z },
  { id: "vld", name: "Владикавказ", lat: 43.0246, lon: 44.6818, zoom: Z },
  { id: "grz", name: "Грозный", lat: 43.3183, lon: 45.6922, zoom: Z },
  { id: "tam", name: "Тамбов", lat: 52.7212, lon: 41.4522, zoom: Z },
  { id: "str", name: "Стерлитамак", lat: 53.6306, lon: 55.9317, zoom: Z },
  { id: "kos", name: "Кострома", lat: 57.7679, lon: 40.9269, zoom: Z },
  { id: "petr", name: "Петрозаводск", lat: 61.7859, lon: 34.3469, zoom: Z },
  { id: "ntag", name: "Нижний Тагил", lat: 57.9101, lon: 59.9813, zoom: Z },
  { id: "yola", name: "Йошкар-Ола", lat: 56.6316, lon: 47.8862, zoom: Z },
  { id: "nvr", name: "Новороссийск", lat: 44.7239, lon: 37.7708, zoom: Z },
  { id: "tag", name: "Таганрог", lat: 47.2362, lon: 38.8969, zoom: Z },
  { id: "syk", name: "Сыктывкар", lat: 61.6688, lon: 50.8356, zoom: Z },
  { id: "nor", name: "Норильск", lat: 69.3535, lon: 88.2027, zoom: Z },
  { id: "ang", name: "Ангарск", lat: 52.5448, lon: 103.8886, zoom: Z },
  { id: "bij", name: "Бийск", lat: 52.5186, lon: 85.2072, zoom: Z },
  { id: "kor", name: "Королёв", lat: 55.9222, lon: 37.8546, zoom: Z },
  { id: "myt", name: "Мытищи", lat: 55.9116, lon: 37.7308, zoom: Z },
  { id: "blsh", name: "Балашиха", lat: 55.8094, lon: 37.9581, zoom: Z },
  { id: "odn", name: "Подольск", lat: 55.4319, lon: 37.5457, zoom: Z },
  { id: "him", name: "Химки", lat: 55.897, lon: 37.4297, zoom: Z },
  { id: "sev", name: "Севастополь", lat: 44.6167, lon: 33.5254, zoom: Z },
  { id: "sim", name: "Симферополь", lat: 44.9521, lon: 34.1024, zoom: Z },
  { id: "khab", name: "Нижневартовск", lat: 60.9344, lon: 76.5531, zoom: Z },
  { id: "orsk", name: "Орск", lat: 51.2049, lon: 58.5678, zoom: Z },
  { id: "eng", name: "Энгельс", lat: 51.4853, lon: 46.1267, zoom: Z },
  { id: "bal", name: "Балаково", lat: 52.0278, lon: 47.8007, zoom: Z },
  { id: "psk", name: "Псков", lat: 57.8194, lon: 28.3318, zoom: Z },
].sort((a, b) => a.name.localeCompare(b.name, "ru"));

export const DEFAULT_CITY_ID = "msk";

export function getCityById(id: string): CityOption | undefined {
  return RUSSIAN_CITIES.find((c) => c.id === id);
}

export function filterCitiesByQuery(
  query: string,
  cities: CityOption[] = RUSSIAN_CITIES,
): CityOption[] {
  const q = query.trim().toLocaleLowerCase("ru-RU");
  if (!q) {
    return cities;
  }
  return cities.filter((c) => c.name.toLocaleLowerCase("ru-RU").includes(q));
}
