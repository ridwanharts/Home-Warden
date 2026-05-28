import React, { useState, useEffect } from 'react';
import { View, MaintenanceZone, InventoryItem, RepairDiagnosis, HouseRoom } from './types';
import { INITIAL_ZONES, INITIAL_INVENTORY, INITIAL_ROOMS } from './constants';
import Dashboard from './components/Dashboard';
import Rooms from './components/Rooms';
import Warehouse from './components/Warehouse';
import RepairMentor from './components/RepairMentor';
import History from './components/History';
import { LayoutDashboard, Package, Wrench, Clock, Wifi, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase & Sync Utilities
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './services/firebase';
import {
  subscribeZones,
  subscribeInventory,
  subscribeHistory,
  subscribeRooms,
  remoteSaveZone,
  remoteSaveInventoryItem,
  remoteSaveHistory,
  remoteDeleteHistory,
  remoteSaveRoom,
  remoteDeleteRoom,
  remoteDeleteInventoryItem,
  remoteDeleteZone,
  uploadLocalDataToCloud,
  saveUserDoc,
} from './services/firestoreSync';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Core App State
  const [zones, setZones] = useState<MaintenanceZone[]>(() => {
    const saved = localStorage.getItem('warden_zones');
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('warden_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [history, setHistory] = useState<RepairDiagnosis[]>(() => {
    const saved = localStorage.getItem('warden_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [rooms, setRooms] = useState<HouseRoom[]>(() => {
    const saved = localStorage.getItem('warden_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Real-Time Cloud Subscriptions
  useEffect(() => {
    if (!user) return;

    // Listen to Zones
    const unsubZones = subscribeZones(user.uid, (cloudZones) => {
      setZones(cloudZones);
    });

    // Listen to Inventory
    const unsubInventory = subscribeInventory(user.uid, (cloudInventory) => {
      setInventory(cloudInventory);
    });

    // Listen to Diagnostic History
    const unsubHistory = subscribeHistory(user.uid, (cloudHistory) => {
      setHistory(cloudHistory);
    });

    // Listen to Rooms
    const unsubRooms = subscribeRooms(user.uid, (cloudRooms) => {
      setRooms(cloudRooms);
    });

    return () => {
      unsubZones();
      unsubInventory();
      unsubHistory();
      unsubRooms();
    };
  }, [user]);

  // 3. Local Cache Persistence (For Offline Fallback & Guest Work)
  useEffect(() => {
    localStorage.setItem('warden_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('warden_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('warden_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('warden_rooms', JSON.stringify(rooms));
  }, [rooms]);

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        // Boostrap user profile record
        await saveUserDoc(u.uid, u.email || '', u.displayName || '', u.photoURL || '');
        // Upload any existing offline work to their first backup
        await uploadLocalDataToCloud(u.uid, zones, inventory, history, rooms);
      }
    } catch (err) {
      console.error("Sign-in failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      // Restore guest offline cache state instantly
      const savedZones = localStorage.getItem('warden_zones');
      const savedInventory = localStorage.getItem('warden_inventory');
      const savedHistory = localStorage.getItem('warden_history');
      const savedRooms = localStorage.getItem('warden_rooms');

      setZones(savedZones ? JSON.parse(savedZones) : INITIAL_ZONES);
      setInventory(savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY);
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
      setRooms(savedRooms ? JSON.parse(savedRooms) : INITIAL_ROOMS);
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  // Mutator Actions
  const updateInventoryQuantity = (id: string, delta: number) => {
    const updated = inventory.map(item =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta), lastUpdated: new Date().toISOString() }
        : item
    );

    setInventory(updated);
    if (user) {
      const targetItem = updated.find(item => item.id === id);
      if (targetItem) {
        remoteSaveInventoryItem(user.uid, targetItem);
      }
    }
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Math.random().toString(36).substring(2, 9),
      lastUpdated: new Date().toISOString()
    };

    setInventory(prev => [newItem, ...prev]);
    if (user) {
      remoteSaveInventoryItem(user.uid, newItem);
    }
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    const withUpdateTimestamp: InventoryItem = {
      ...updatedItem,
      lastUpdated: new Date().toISOString()
    };

    setInventory(prev => prev.map(item => item.id === updatedItem.id ? withUpdateTimestamp : item));
    if (user) {
      remoteSaveInventoryItem(user.uid, withUpdateTimestamp);
    }
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    if (user) {
      remoteDeleteInventoryItem(user.uid, id);
    }
  };

  const saveRepairResult = (result: RepairDiagnosis) => {
    setHistory(prev => [result, ...prev]);
    if (user) {
      remoteSaveHistory(user.uid, result);
    }
  };

  const deleteRepairResult = (id: string) => {
    setHistory(prev => prev.filter(entry => entry.id !== id));
    if (user) {
      remoteDeleteHistory(user.uid, id);
    }
  };

  const handleInspectSistem = () => {
    const updatedZones = zones.map(z => ({
      ...z,
      score: 100,
      lastMaintained: new Date().toISOString()
    }));

    setZones(updatedZones);
    if (user) {
      updatedZones.forEach(z => {
        remoteSaveZone(user.uid, z);
      });
    }
  };

  const handleAddZone = (zoneData: Omit<MaintenanceZone, 'id'>) => {
    const newZone: MaintenanceZone = {
      ...zoneData,
      id: 'zone_' + Math.random().toString(36).substring(2, 9)
    };
    setZones(prev => [...prev, newZone]);
    if (user) {
      remoteSaveZone(user.uid, newZone);
    }
  };

  const handleUpdateZone = (updatedZone: MaintenanceZone) => {
    setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
    if (user) {
      remoteSaveZone(user.uid, updatedZone);
    }
  };

  const handleDeleteZone = (zoneId: string) => {
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (user) {
      remoteDeleteZone(user.uid, zoneId);
    }
  };

  const handleAddRoom = (roomData: Omit<HouseRoom, 'id' | 'createdAt' | 'items'>) => {
    const newRoom: HouseRoom = {
      ...roomData,
      id: 'room_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      items: []
    };

    setRooms(prev => [...prev, newRoom]);
    if (user) {
      remoteSaveRoom(user.uid, newRoom);
    }
  };

  const handleUpdateRoom = (updatedRoom: HouseRoom) => {
    setRooms(prev => prev.map(room => room.id === updatedRoom.id ? updatedRoom : room));
    if (user) {
      remoteSaveRoom(user.uid, updatedRoom);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    if (user) {
      remoteDeleteRoom(user.uid, roomId);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            zones={zones}
            inventory={inventory}
            rooms={rooms}
            history={history}
            onInspect={handleInspectSistem}
            onNavigate={(view) => setCurrentView(view)}
            onAddZone={handleAddZone}
            onUpdateZone={handleUpdateZone}
            onDeleteZone={handleDeleteZone}
          />
        );
      case 'rooms':
        return <Rooms rooms={rooms} onAddRoom={handleAddRoom} onUpdateRoom={handleUpdateRoom} onDeleteRoom={handleDeleteRoom} />;
      case 'warehouse':
        return <Warehouse inventory={inventory} onUpdateQuantity={updateInventoryQuantity} onAddItem={addInventoryItem} onUpdateItem={updateInventoryItem} onDeleteItem={deleteInventoryItem} />;
      case 'repair':
        return (
          <RepairMentor 
            onSaveResult={saveRepairResult} 
            onAddShoppingItem={(name) => {
              addInventoryItem({
                name,
                category: 'Bahan Perbaikan',
                type: 'Shopping',
                quantity: 1,
                unit: 'Pcs',
                health: 100,
                estimatedPrice: 0,
                isBought: false
              });
            }}
          />
        );
      case 'history':
        return <History history={history} onDeleteHistory={deleteRepairResult} />;
      default:
        return (
          <Dashboard
            zones={zones}
            inventory={inventory}
            rooms={rooms}
            history={history}
            onInspect={handleInspectSistem}
            onNavigate={(view) => setCurrentView(view)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 industrial-grid selection:bg-indigo-500 selection:text-white">
      {/* Header with Integrated Identity & Auth Synchronization */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-2.5 flex items-center justify-between h-12">
        <div className="flex items-center gap-2">
          <svg className="w-5.5 h-5.5 shrink-0 select-none filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shield Outer Gold Border */}
            <path d="M12 22C12 22 20 18 20 12V5L12 2Z" fill="#EAB308" />
            <path d="M12 22C12 22 4 18 4 12V5L12 2Z" fill="#FDE047" />
            
            {/* Shield Inner Red Background */}
            <path d="M12 19.5C12 19.5 18 16.2 18 11.5V5.8L12 3.3Z" fill="#DC2626" />
            <path d="M12 19.5C12 19.5 6 16.2 6 11.5V5.8L12 3.3Z" fill="#EF4444" />
            
            {/* Center Yellow/Gold Star */}
            <polygon points="12,7 13.5,10.2 17,10.2 14.1,12.3 15.2,15.6 12,13.5 8.8,15.6 9.9,12.3 7,10.2 10.5,10.2" fill="#FDE047" stroke="#EAB308" strokeWidth="0.5" />
          </svg>
          <h1 className="font-extrabold tracking-wider text-[11px] sm:text-xs uppercase text-amber-400">Rumah Bapak</h1>
        </div>

        {!loadingAuth && (
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-1.5 py-0.5 rounded-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profil'}
                    className="w-4 h-4 rounded-full border border-indigo-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-[8px] text-white uppercase shrink-0">
                    {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}
                  </div>
                )}
                <span className="text-[9px] font-bold text-slate-300 max-w-[70px] truncate leading-none">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Tersinkronisasi Cloud" />
                <button
                  onClick={handleSignOut}
                  className="text-[8px] uppercase font-extrabold text-slate-500 hover:text-rose-400 pl-1.5 ml-0.5 border-l border-slate-800 leading-none cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-lg font-bold text-[8px] uppercase tracking-wider cursor-pointer transition-all active:scale-[0.98]"
              >
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.91h6.63c-.29 1.5-1.14 2.76-2.4 3.6l3.75 2.91c2.2-2.03 3.46-5.02 3.46-8.44z" fill="currentColor"/>
                  <path d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.75-2.91c-1.17.78-2.67 1.25-4.21 1.25-3.24 0-5.99-2.19-6.97-5.13l-3.87 3c1.91 3.8 5.86 6.3 10.42 6.3z" fill="currentColor"/>
                  <path d="M5.03 14.26c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38L1.16 6.5C.42 8 .03 10 .03 12c0 2 0 4 .39 5.5l4.64-3.24z" fill="currentColor"/>
                  <path d="M12 4.75c1.77 0 3.37.61 4.62 1.8l3.46-3.46C18.12 1.24 15.3 0 12 0 7.44 0 3.49 2.5 1.16 6.5l3.87 3c.98-2.94 3.73-5.13 6.97-5.13z" fill="currentColor"/>
                </svg>
                Hubungkan Google
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 z-50">
        <div className="max-w-md mx-auto grid grid-cols-5 h-14">
          <NavButton
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
            icon={<LayoutDashboard size={18} />}
            label="Home"
          />
          <NavButton
            active={currentView === 'rooms'}
            onClick={() => setCurrentView('rooms')}
            icon={<Home size={18} />}
            label="Ruangan"
          />
          <NavButton
            active={currentView === 'warehouse'}
            onClick={() => setCurrentView('warehouse')}
            icon={<Package size={18} />}
            label="Gudang"
          />
          <NavButton
            active={currentView === 'repair'}
            onClick={() => setCurrentView('repair')}
            icon={<Wrench size={18} />}
            label="Reparasi"
          />
          <NavButton
            active={currentView === 'history'}
            onClick={() => setCurrentView('history')}
            icon={<Clock size={18} />}
            label="Arsip"
          />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-0.5 transition-all relative overflow-hidden cursor-pointer ${
        active ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-400'
      }`}
    >
      {active && (
        <motion.div
          layoutId="nav-active"
          className="absolute inset-0 bg-indigo-500/5"
        />
      )}
      {icon}
      <span className="text-[9px] uppercase font-bold tracking-widest">{label}</span>
      {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />}
    </button>
  );
}
