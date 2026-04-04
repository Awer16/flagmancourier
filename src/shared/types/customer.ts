export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
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
}

export interface DeliveryLocation {
  lat: number;
  lon: number;
  label: string;
}
