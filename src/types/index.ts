export type Category =
  | "Abri"
  | "Couchage"
  | "Sac"
  | "Vêtements"
  | "Cuisine"
  | "Nourriture"
  | "Électronique"
  | "Hygiène/Secours"
  | "Accessoires"
  | "Autre";

export interface Item {
  id: string;
  name: string;
  category: Category;
  brand?: string;
  weight: number;
  price?: number;
  image_url?: string;
  url?: string;
  quantity: number;
  notes?: string;
  user_id?: string;
}

export interface PackItem {
  id: string;
  item: Item;
  isConsumable: boolean;
  isWorn: boolean;
  quantity: number;
}

export interface PackConfig {
  id: string;
  name: string;
  icon?: string;
  items: PackItem[];
}

