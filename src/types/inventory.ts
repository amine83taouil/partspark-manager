export interface Part {
  id: string;
  sku: string;
  name: string;
  category: Category;
  quantity: number;
  location: string;
  supplier: string;
  unitCost: number;
  reorderThreshold: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Category =
  | "Adhésif"
  | "Antenne"
  | "Batterie"
  | "Caméra"
  | "Châssis"
  | "Connecteur de charge"
  | "Écouteur interne"
  | "Écran complet"
  | "Haut-parleur"
  | "Lentille caméra"
  | "Nappe"
  | "Tiroir SIM"
  | "Vibreur"
  | "Visserie"
  | "Vitre arrière";

export const CATEGORIES: Category[] = [
  "Adhésif",
  "Antenne",
  "Batterie",
  "Caméra",
  "Châssis",
  "Connecteur de charge",
  "Écouteur interne",
  "Écran complet",
  "Haut-parleur",
  "Lentille caméra",
  "Nappe",
  "Tiroir SIM",
  "Vibreur",
  "Visserie",
  "Vitre arrière",
];

export interface PartFormData {
  name: string;
  category: Category;
  brand: string;
  quantity: number;
  location: string;
  supplier: string;
  unitCost: number;
  reorderThreshold: number;
  notes: string;
}

export interface InventoryStats {
  totalParts: number;
  lowStockItems: number;
  totalValue: number;
  categoryBreakdown: Record<Category, number>;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  action: "CREATE" | "UPDATE" | "DELETE" | "STOCK_ADJUST";
  partId: string;
  partName: string;
  details: string;
  userName?: string;
}