import React, { useState, useEffect } from 'react';
import { View, MaintenanceZone, InventoryItem, RepairDiagnosis } from './types';
import { INITIAL_ZONES, INITIAL_INVENTORY } from './constants';
import Dashboard from './components/Dashboard';
import Warehouse from './components/Warehouse';
import RepairMentor from './components/RepairMentor';
import History from './components/History';
import { LayoutDashboard, Package, Wrench, Clock, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Firebase & Sync Utilities
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signInWithGoogle, logOut } from './services/firebase';
import {
  subscribeZones,
  subscribeInventory,
  subscribeHistory,
  remoteSaveZone,
  remoteSaveInventoryItem,
  remoteSaveHistory,
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
      if (cloudZones.length > 0) {
        setZones(cloudZones);
      }
    });

    // Listen to Inventory
    const unsubInventory = subscribeInventory(user.uid, (cloudInventory) => {
      if (cloudInventory.length > 0) {
        setInventory(cloudInventory);
      }
    });

    // Listen to Diagnostic History
    const unsubHistory = subscribeHistory(user.uid, (cloudHistory) => {
      setHistory(cloudHistory);
    });

    return () => {
      unsubZones();
      unsubInventory();
      unsubHistory();
    };
  }, [user]);

  // 3. Local Cache Persistence (For Offline Guest Work)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('warden_zones', JSON.stringify(zones));
    }
  }, [zones, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('warden_inventory', JSON.stringify(inventory));
    }
  }, [inventory, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('warden_history', JSON.stringify(history));
    }
  }, [history, user]);

  // Auth Handlers
  const handleSignIn = async () => {
    try {
      const u = await signInWithGoogle();
      if (u) {
        // Boostrap user profile record
        await saveUserDoc(u.uid, u.email || '', u.displayName || '', u.photoURL || '');
        // Upload any existing offline work to their first backup
        await uploadLocalDataToCloud(u.uid, zones, inventory, history);
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

      setZones(savedZones ? JSON.parse(savedZones) : INITIAL_ZONES);
      setInventory(savedInventory ? JSON.parse(savedInventory) : INITIAL_INVENTORY);
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
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

    if (user) {
      const targetItem = updated.find(item => item.id === id);
      if (targetItem) {
        remoteSaveInventoryItem(user.uid, targetItem);
      }
    } else {
      setInventory(updated);
    }
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Math.random().toString(36).substring(2, 9),
      lastUpdated: new Date().toISOString()
    };

    if (user) {
      remoteSaveInventoryItem(user.uid, newItem);
    } else {
      setInventory(prev => [newItem, ...prev]);
    }
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    const withUpdateTimestamp: InventoryItem = {
      ...updatedItem,
      lastUpdated: new Date().toISOString()
    };

    if (user) {
      remoteSaveInventoryItem(user.uid, withUpdateTimestamp);
    } else {
      setInventory(prev => prev.map(item => item.id === updatedItem.id ? withUpdateTimestamp : item));
    }
  };

  const saveRepairResult = (result: RepairDiagnosis) => {
    if (user) {
      remoteSaveHistory(user.uid, result);
    } else {
      setHistory(prev => [result, ...prev]);
    }
  };

  const handleInspectSistem = () => {
    const updatedZones = zones.map(z => ({
      ...z,
      score: 100,
      lastMaintained: new Date().toISOString()
    }));

    if (user) {
      updatedZones.forEach(z => {
        remoteSaveZone(user.uid, z);
      });
    } else {
      setZones(updatedZones);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard zones={zones} onInspect={handleInspectSistem} />;
      case 'warehouse':
        return <Warehouse inventory={inventory} onUpdateQuantity={updateInventoryQuantity} onAddItem={addInventoryItem} onUpdateItem={updateInventoryItem} />;
      case 'repair':
        return <RepairMentor onSaveResult={saveRepairResult} />;
      case 'history':
        return <History history={history} />;
      default:
        return <Dashboard zones={zones} onInspect={handleInspectSistem} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 industrial-grid selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">W</span>
          </div>
          <h1 className="font-bold tracking-tight text-xl uppercase text-indigo-400">Home Warden</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">System Active</span>
        </div>
      </header>

      {/* Auth Account Synchronization Status Banner */}
      {!loadingAuth && (
        <div className="sticky top-[71px] z-40">
          {user ? (
            <div className="bg-slate-900/90 backdrop-blur-md border-b border-indigo-500/10 px-6 py-3.5 flex items-center justify-between text-xs max-w-md mx-auto rounded-b-2xl shadow-lg shadow-indigo-505/5">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profil'}
                    className="w-6 h-6 rounded-full border border-indigo-500/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-[10px] text-white uppercase">
                    {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}
                  </div>
                )}
                <div>
                  <div className="font-bold text-slate-200 line-clamp-1">{user.displayName || user.email || 'Home Warden User'}</div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium leading-none mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Tersinkronisasi Cloud
                  </div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-[9px] uppercase font-bold tracking-wider text-slate-400 hover:text-rose-400 transition-colors cursor-pointer bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 px-2.5 py-1.5 rounded-lg"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/50 backdrop-blur-md border-b border-indigo-500/10 px-6 py-4 flex flex-col gap-3 items-center justify-between max-w-md mx-auto rounded-b-2xl shadow-xl shadow-slate-950/30">
              <div className="text-center sm:text-left w-full">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                  <Wifi size={12} className="text-indigo-400" />
                  Backup & Sinkronisasi
                </h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  Hubungkan dengan akun Google Anda untuk menyimpan log gudang, zona, dan riwayat diagnosis secara permanen.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase tracking-widest py-3 rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer transition-all active:scale-[0.98]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.91h6.63c-.29 1.5-1.14 2.76-2.4 3.6l3.75 2.91c2.2-2.03 3.46-5.02 3.46-8.44z" fill="#4285F4"/>
                  <path d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.75-2.91c-1.17.78-2.67 1.25-4.21 1.25-3.24 0-5.99-2.19-6.97-5.13l-3.87 3c1.91 3.8 5.86 6.3 10.42 6.3z" fill="#34A853"/>
                  <path d="M5.03 14.26c-.25-.75-.39-1.55-.39-2.38s.14-1.63.39-2.38L1.16 6.5C.42 8 .03 10 .03 12c0 2 0 4 .39 5.5l4.64-3.24z" fill="#FBBC05"/>
                  <path d="M12 4.75c1.77 0 3.37.61 4.62 1.8l3.46-3.46C18.12 1.24 15.3 0 12 0 7.44 0 3.49 2.5 1.16 6.5l3.87 3c.98-2.94 3.73-5.13 6.97-5.13z" fill="#EA4335"/>
                </svg>
                Hubungkan dengan Google
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-md mx-auto p-6 min-h-[calc(100vh-210px)]">
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
        <div className="max-w-md mx-auto grid grid-cols-4 h-20">
          <NavButton
            active={currentView === 'dashboard'}
            onClick={() => setCurrentView('dashboard')}
            icon={<LayoutDashboard size={22} />}
            label="Home"
          />
          <NavButton
            active={currentView === 'warehouse'}
            onClick={() => setCurrentView('warehouse')}
            icon={<Package size={22} />}
            label="Gudang"
          />
          <NavButton
            active={currentView === 'repair'}
            onClick={() => setCurrentView('repair')}
            icon={<Wrench size={22} />}
            label="Reparasi"
          />
          <NavButton
            active={currentView === 'history'}
            onClick={() => setCurrentView('history')}
            icon={<Clock size={22} />}
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
      className={`flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden cursor-pointer ${
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
      <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      {active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-full" />}
    </button>
  );
}
