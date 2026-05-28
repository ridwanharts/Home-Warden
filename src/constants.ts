import { MaintenanceZone, InventoryItem, HouseRoom } from './types';

export const INITIAL_ROOMS: HouseRoom[] = [
  {
    id: 'room_bathroom_1',
    name: 'Kamar Mandi Utama',
    type: 'Kamar Mandi',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    items: [
      {
        id: 'ri_kran',
        name: 'Kran Wastafel & Seal',
        status: 'good',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().split('T')[0],
        notes: 'Merek Toto, cek kebocoran drat bawah'
      },
      {
        id: 'ri_exhaust',
        name: 'Exhaust Fan Plafon',
        status: 'warning',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString().split('T')[0],
        notes: 'Sering berisik & berputar agak lambat, perlu dibersihkan & diberi pelumas wd-40'
      }
    ]
  },
  {
    id: 'room_kitchen_1',
    name: 'Dapur & Ruang Makan',
    type: 'Dapur',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    items: [
      {
        id: 'ri_kulkas',
        name: 'Kulkas Showcase',
        status: 'good',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString().split('T')[0],
        notes: 'Suhu stabil, karet pintu masih rapat sempurna'
      },
      {
        id: 'ri_kompor',
        name: 'Kompor Gas Rinnai',
        status: 'good',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString().split('T')[0],
        notes: 'Selang regulator gas aman, api berwarna biru'
      }
    ]
  },
  {
    id: 'room_living_1',
    name: 'Ruang Keluarga',
    type: 'Ruang Tamu',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
    items: [
      {
        id: 'ri_ac',
        name: 'AC Split Daikin 1 PK',
        status: 'warning',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString().split('T')[0],
        notes: 'Terakhir cuci AC 1.5 bulan lalu. Agak kurang dingin, perlu cek tekanan freon'
      },
      {
        id: 'ri_lampu_utama',
        name: 'Lampu Utama Downlight',
        status: 'broken',
        lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString().split('T')[0],
        notes: 'Sering berkedip lalu mati total, bohlam gosong perlu diganti bohlam LED 12W'
      }
    ]
  }
];

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
    lastUpdated: new Date().toISOString(),
    entryDate: '2026-01-15'
  },
  {
    id: '2',
    name: 'Seal Tape',
    category: 'Plumbing',
    type: 'Consumable',
    quantity: 3,
    unit: 'Roll',
    health: 100,
    lastUpdated: new Date().toISOString(),
    entryDate: '2026-04-20'
  },
  {
    id: '3',
    name: 'Paku Beton 5cm',
    category: 'Hardware',
    type: 'Consumable',
    quantity: 50,
    unit: 'Pcs',
    health: 100,
    lastUpdated: new Date().toISOString(),
    entryDate: '2026-05-10'
  }
];
