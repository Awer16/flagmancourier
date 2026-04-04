export interface HomeStore {
  id: string;
  name: string;
  imageUrl: string;
  deliveryEtaMin: number;
  rating: number;
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
