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
  entryDate?: string; // Tanggal pembelian atau masuk gudang
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
  id: string;
  problem: string;
  diagnosis: string;
  shoppingList: string[];
  toolsNeeded: string[];
  steps: string[];
  safetyWarning?: string;
  timestamp: string;
}

export interface RoomItem {
  id: string;
  name: string;
  status: 'good' | 'warning' | 'broken'; // 'good' = Baik, 'warning' = Butuh Perhatian/Pengecekan, 'broken' = Rusak/Butuh Service
  lastChecked: string;
  notes?: string;
}

export interface HouseRoom {
  id: string;
  name: string;
  type: string; // e.g., 'Kamar Mandi', 'Kamar Tidur', 'Dapur', 'Ruang Keluarga'
  items: RoomItem[];
  createdAt: string;
}

export type View = 'dashboard' | 'rooms' | 'warehouse' | 'repair' | 'history';
