export interface HomeStore {
  id: string;
  name: string;
  imageUrl: string;
  deliveryEtaMin: number;
  rating: number;
  cityId: string;
  lat: number;
  lon: number;
  address: string;
  description: string;
  cuisine: string;
}

export interface HomeStoreCategory {
  id: string;
  title: string;
  subtitle: string;
  stores: HomeStore[];
}

export interface HomeStoreWithCategory extends HomeStore {
  categoryId: string;
  categoryTitle: string;
}
