export type ItemType = 'Tool' | 'Consumable';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  type: ItemType;
  quantity: number;
  unit: string;
  health: number; // 0-100 for tools
  lastUpdated: string;
  imageUrl?: string;
}

export interface MaintenanceZone {
  id: string;
  name: string;
  score: number;
  lastMaintained: string;
  intervalMonths: number;
  tasks: string[];
}

export interface RepairDiagnosis {
  problem: string;
  diagnosis: string;
  shoppingList: string[];
  toolsNeeded: string[];
  steps: string[];
  safetyWarning?: string;
  timestamp: string;
}

export type View = 'dashboard' | 'warehouse' | 'repair' | 'history';
