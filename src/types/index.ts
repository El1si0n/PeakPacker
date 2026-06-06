export type Category =
  | "Abri"
  | "Couchage"
  | "Sac"
  | "Vêtements"
  | "Cuisine"
  | "Nourriture"
  | "Hydratation"
  | "Électronique"
  | "Hygiène"
  | "Secours"
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
  assigned_to?: string; // UUID of the user carrying it
}

export interface BagCollaborator {
  user_id: string;
  role: string;
  email?: string;
  user?: { email?: string; id?: string }; // In case we join auth.users in the future
}

export interface PackConfig {
  id: string;
  name: string;
  icon?: string;
  user_id?: string; // the owner
  items: PackItem[];
  collaborators?: BagCollaborator[];
}

