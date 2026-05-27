import { MaintenanceZone, InventoryItem } from './types';

export const INITIAL_ZONES: MaintenanceZone[] = [
  {
    id: 'exterior',
    name: 'Eksterior',
    score: 85,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 2).toISOString(), // 2 months ago
    intervalMonths: 6,
    tasks: ['Cek Talang', 'Cek Atap', 'Pagar']
  },
  {
    id: 'interior',
    name: 'Interior',
    score: 95,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), 
    intervalMonths: 3,
    tasks: ['AC Service', 'Kelistrikan', 'Pipa']
  },
  {
    id: 'electronics',
    name: 'Elektronik',
    score: 70,
    lastMaintained: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 5).toISOString(), 
    intervalMonths: 4,
    tasks: ['Kulkas', 'Mesin Cuci', 'Lampu']
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: '1',
    name: 'Bor Maktec RT0700C',
    category: 'Power Tools',
    type: 'Tool',
    quantity: 1,
    unit: 'Unit',
    health: 90,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Seal Tape',
    category: 'Plumbing',
    type: 'Consumable',
    quantity: 3,
    unit: 'Roll',
    health: 100,
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Paku Beton 5cm',
    category: 'Hardware',
    type: 'Consumable',
    quantity: 50,
    unit: 'Pcs',
    health: 100,
    lastUpdated: new Date().toISOString()
  }
];
