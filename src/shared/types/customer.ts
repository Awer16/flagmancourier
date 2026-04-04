export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  imageUrl?: string;
  oldPrice?: number;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  lat: number;
  lon: number;
  address: string;
  cuisine: string;
  deliveryEtaMin: number;
  menu: MenuItem[];
  cityId: string;
}

export interface DeliveryLocation {
  lat: number;
  lon: number;
  label: string;
}
