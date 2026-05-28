import React, { useState } from 'react';
import { HouseRoom, RoomItem } from '../types';
import { 
  Plus, 
  Trash2, 
  ChevronLeft, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ClipboardList, 
  Sparkles,
  Home,
  Tag,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  rooms: HouseRoom[];
  onAddRoom: (room: Omit<HouseRoom, 'id' | 'createdAt' | 'items'>) => void;
  onUpdateRoom: (room: HouseRoom) => void;
  onDeleteRoom: (roomId: string) => void;
}

const ROOM_TYPES = [
  'Kamar Mandi',
  'Kamar Tidur',
  'Dapur',
  'Ruang Tamu',
  'Ruang Makan',
  'Ruang Keluarga',
  'Garasi',
  'Teras',
  'Lainnya'
];

export default function Rooms({ rooms, onAddRoom, onUpdateRoom, onDeleteRoom }: Props) {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  
  // Create Room Form State
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('Kamar Tidur');

  // Add Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemStatus, setNewItemStatus] = useState<'good' | 'warning' | 'broken'>('good');
  const [newItemNotes, setNewItemNotes] = useState('');

  // Active room object
  const activeRoom = rooms.find(r => r.id === activeRoomId);

  // Stats calculation
  const totalRooms = rooms.length;
  const allItems = rooms.flatMap(r => r.items);
  const totalItems = allItems.length;
  const goodItemsCount = allItems.filter(i => i.status === 'good').length;
  const warningItemsCount = allItems.filter(i => i.status === 'warning').length;
  const brokenItemsCount = allItems.filter(i => i.status === 'broken').length;

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    
    onAddRoom({
      name: newRoomName.trim(),
      type: newRoomType
    });

    setNewRoomName('');
    setNewRoomType('Kamar Tidur');
    setIsAddingRoom(false);
  };

  const handleDeleteActiveRoom = () => {
    if (!activeRoom) return;
    if (confirm(`Apakah Anda yakin ingin menghapus ruangan "${activeRoom.name}" beserta seluruh isinya?`)) {
      onDeleteRoom(activeRoom.id);
      setActiveRoomId(null);
    }
  };

  // Add Item to active room
  const handleAddItemToRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom || !newItemName.trim()) return;

    const newItem: RoomItem = {
      id: 'item_' + Math.random().toString(36).substring(2, 9),
      name: newItemName.trim(),
      status: newItemStatus,
      lastChecked: new Date().toISOString().split('T')[0],
      notes: newItemNotes.trim() || undefined
    };

    const updatedRoom: HouseRoom = {
      ...activeRoom,
      items: [...activeRoom.items, newItem]
    };

    onUpdateRoom(updatedRoom);
    setNewItemName('');
    setNewItemStatus('good');
    setNewItemNotes('');
    setIsAddingItem(false);
  };

  // Turn status icon
  const getStatusBadge = (status: 'good' | 'warning' | 'broken') => {
    switch (status) {
      case 'good':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-extrabold border border-emerald-500/10 uppercase tracking-wider">
            <CheckCircle2 size={10} /> Baik
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-extrabold border border-amber-500/10 uppercase tracking-wider">
            <AlertTriangle size={10} /> Cek Rutin
          </span>
        );
      case 'broken':
        return (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-extrabold border border-rose-500/10 uppercase tracking-wider text-glow-rose">
            <AlertCircle size={10} /> Rusak/Service
          </span>
        );
    }
  };

  // Quick state update for room items
  const updateItemStatus = (itemId: string, newStatus: 'good' | 'warning' | 'broken') => {
    if (!activeRoom) return;

    const updatedItems = activeRoom.items.map(item => 
      item.id === itemId 
        ? { ...item, status: newStatus, lastChecked: new Date().toISOString().split('T')[0] } 
        : item
    );

    onUpdateRoom({
      ...activeRoom,
      items: updatedItems
    });
  };

  // Perform quick inspection check
  const checkItemNow = (itemId: string) => {
    if (!activeRoom) return;

    const updatedItems = activeRoom.items.map(item => 
      item.id === itemId 
        ? { ...item, lastChecked: new Date().toISOString().split('T')[0] } 
        : item
    );

    onUpdateRoom({
      ...activeRoom,
      items: updatedItems
    });
  };

  // Delete item from room
  const deleteItemFromRoom = (itemId: string) => {
    if (!activeRoom) return;
    const itemToDelete = activeRoom.items.find(item => item.id === itemId);
    if (!itemToDelete) return;

    if (confirm(`Apakah Anda yakin ingin menghapus barang "${itemToDelete.name}" dari ruangan "${activeRoom.name}"?`)) {
      const updatedItems = activeRoom.items.filter(item => item.id !== itemId);

      onUpdateRoom({
        ...activeRoom,
        items: updatedItems
      });
    }
  };

  return (
    <div className="space-y-6 pb-24 text-slate-100">
      <AnimatePresence mode="wait">
        {!activeRoom ? (
          /* =========================================================================
             VIEW 1: ROOMS GRID & SUMMARY 
             ========================================================================= */
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            {/* Rooms Management Overview / Summary Card */}
            <section className="bg-gradient-to-br from-indigo-700/10 via-slate-900 to-slate-950 border border-indigo-500/15 p-6 rounded-3xl relative overflow-hidden shadow-xl shadow-slate-950/40">
              <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={11} /> Manajemen Ruangan
                </span>
                <span className="text-[10px] px-2.5 py-0.5 bg-slate-800 rounded-full border border-slate-700 font-mono text-slate-400">
                  Total: {totalRooms} Ruang
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-2.5">
                  <div className="text-xl font-bold text-indigo-400 font-mono">{totalItems}</div>
                  <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">Total Item</div>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-2.5">
                  <div className="text-xl font-bold text-emerald-400 font-mono">{goodItemsCount}</div>
                  <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">Status OK</div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-2.5">
                  <div className="text-xl font-bold text-amber-400 font-mono">{warningItemsCount}</div>
                  <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">Perlu Cek</div>
                </div>
                <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-2.5">
                  <div className="text-xl font-bold text-rose-400 font-mono">{brokenItemsCount}</div>
                  <div className="text-[8px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5 leading-none">Rusak</div>
                </div>
              </div>
            </section>

            {/* Title & Add Room Trigger Button */}
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Daftar Ruangan</h3>
              {!isAddingRoom && (
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(true)}
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/10"
                >
                  <Plus size={12} /> Tambah Ruang
                </button>
              )}
            </div>

            {/* Create Room Interactive Inline form */}
            {isAddingRoom && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl"
                onSubmit={handleCreateRoom}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
                    <Tag size={12} className="text-indigo-400" /> Daftarkan Ruangan Baru
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingRoom(false)} 
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Ruangan</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kamar Orangtua, Kamar Mandi Atas"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori / Tipe Ruang</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {ROOM_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewRoomType(type)}
                          className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all truncate cursor-pointer ${
                            newRoomType === type 
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-indigo-400' 
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:bg-slate-905 hover:text-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl uppercase text-[10px] tracking-wider transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Simpan Ruangan
                </button>
              </motion.form>
            )}

            {/* List of Rooms */}
            <div className="space-y-3">
              {rooms.length === 0 ? (
                <div className="bg-slate-950 border border-slate-900 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500">
                    <Home size={20} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Belum Ada Ruangan</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto text-center leading-relaxed">
                      Daftarkan ruangan pertama Anda seperti kamar mandi atau ruang tamu untuk mulai menjadwalkan pengecekan rutin barang.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingRoom(true)}
                    className="mt-2 bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    Tambah Ruang Sekarang
                  </button>
                </div>
              ) : (
                rooms.map((room) => {
                  const roomWarningCount = room.items.filter(i => i.status === 'warning').length;
                  const roomBrokenCount = room.items.filter(i => i.status === 'broken').length;
                  const roomGoodCount = room.items.filter(i => i.status === 'good').length;

                  // Overall Room Health Indicator Color
                  let borderHighlight = 'border-slate-800/80 hover:border-indigo-500/15';
                  let statusLabelText = 'Semua Aman';
                  let statusColor = 'text-emerald-500';

                  if (roomBrokenCount > 0) {
                    borderHighlight = 'border-rose-500/20 hover:border-rose-500/35';
                    statusLabelText = `${roomBrokenCount} Alat Rusak`;
                    statusColor = 'text-rose-400';
                  } else if (roomWarningCount > 0) {
                    borderHighlight = 'border-amber-500/20 hover:border-amber-500/35';
                    statusLabelText = `${roomWarningCount} Perlu Cek`;
                    statusColor = 'text-amber-400';
                  }

                  return (
                    <motion.div
                      key={room.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveRoomId(room.id)}
                      className={`glass-card p-4.5 flex items-center justify-between border ${borderHighlight} transition-all cursor-pointer group`}
                    >
                      <div className="min-w-0 pr-4">
                        <span className="text-[8px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-extrabold uppercase tracking-widest">
                          {room.type}
                        </span>
                        <h4 className="font-extrabold text-base text-slate-100 group-hover:text-indigo-400 transition-colors mt-1.5 truncate">
                          {room.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {room.items.length} Barang Terpantau
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-[10px] font-extrabold uppercase tracking-widest ${statusColor} bg-slate-950/40 border border-slate-900 px-2 py-1 rounded-md leading-none shadow-sm`}>
                          {statusLabelText}
                        </div>
                        <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1 justify-end font-mono">
                          Buka Detail <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             VIEW 2: ROOM DRILL DOWN (ACTIVE ROOM DETAILS)
             ========================================================================= */
          <motion.div
            key="details"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="space-y-5"
          >
            {/* Header / Back Action */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setActiveRoomId(null);
                  setIsAddingItem(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest cursor-pointer bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl"
              >
                <ChevronLeft size={14} /> Kembali
              </button>
              
              <button
                type="button"
                onClick={handleDeleteActiveRoom}
                className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-all uppercase tracking-widest cursor-pointer px-2.5 py-2 hover:bg-rose-500/10 rounded-lg shrink-0"
              >
                Hapus Ruang
              </button>
            </div>

            {/* Room Banner Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-800/80 p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 px-2 py-0.5 rounded font-extrabold uppercase tracking-widest">
                {activeRoom?.type}
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-2 leading-tight">
                {activeRoom?.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Gunakan tab ini untuk merekam kondisi lampu, kran, AC, kulkas, kompor, dan kelengkapan lain yang dipantau berkala.
              </p>
            </div>

            {/* List & Add Item Trigger Header */}
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Item & Barang Terpantau ({activeRoom?.items.length})
              </h3>
              {!isAddingItem && (
                <button
                  type="button"
                  onClick={() => setIsAddingItem(true)}
                  className="flex items-center gap-1 text-[10px] uppercase font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-indigo-500/5 hover:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/10"
                >
                  <Plus size={12} /> Tambah Item
                </button>
              )}
            </div>

            {/* Add Item form inside room details */}
            {isAddingItem && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-xl"
                onSubmit={handleAddItemToRoom}
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
                    Tambah Barang Terpantau
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setIsAddingItem(false)} 
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Barang / Mesin</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Lampu Utama, AC Split, Kran Wastafel"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kondisi Awal</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewItemStatus('good')}
                        className={`py-2 px-1 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          newItemStatus === 'good' 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        BAIK
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemStatus('warning')}
                        className={`py-2 px-1 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          newItemStatus === 'warning' 
                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        MESTINE CEK
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemStatus('broken')}
                        className={`py-2 px-1 text-[10px] font-extrabold rounded-lg border text-center transition-all cursor-pointer ${
                          newItemStatus === 'broken' 
                            ? 'bg-rose-500/10 border-rose-500/50 text-rose-400' 
                            : 'bg-slate-950/60 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        RUSAK
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Catatan Spesifikasi / Troubleshooting (Opsional)</label>
                    <textarea
                      placeholder="Contoh: Merek Philips LED 15W, dipasang Januari 2026. Sering berkedip jika tegangan labil."
                      value={newItemNotes}
                      rows={2}
                      onChange={(e) => setNewItemNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl uppercase text-[10px] tracking-wider transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer"
                >
                  Daftarkan Item
                </button>
              </motion.form>
            )}

            {/* List of room items inside specific active room */}
            <div className="space-y-3">
              {!activeRoom?.items || activeRoom.items.length === 0 ? (
                <div className="bg-slate-950 border border-slate-900 border-dashed rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-2">
                  <ClipboardList size={22} className="text-slate-600" />
                  <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-widest">Belum Ada Item Terpantau</h4>
                  <p className="text-[11px] text-slate-500 max-w-[200px] leading-relaxed">
                    Mulai dengan mendaftarkan barang/alat di ruangan ini untuk memantau kelayakannya rutin.
                  </p>
                </div>
              ) : (
                activeRoom.items.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className="glass-card p-4 border border-slate-800/80 relative overflow-hidden group space-y-3"
                    >
                      {/* Left side highlight line based on status */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${
                        item.status === 'good' ? 'bg-emerald-500' :
                        item.status === 'warning' ? 'bg-amber-400' :
                        'bg-rose-500 animate-pulse'
                      }`} />

                      {/* Top Row: Item Title & Status Display */}
                      <div className="flex justify-between items-start gap-4 pl-1.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors">
                            {item.name}
                          </h4>
                          {item.notes && (
                            <p className="text-[11px] text-slate-400/90 leading-normal mt-1 italic">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {getStatusBadge(item.status)}
                          <button
                            type="button"
                            onClick={() => deleteItemFromRoom(item.id)}
                            className="bg-slate-950/80 border border-slate-900 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-950 cursor-pointer transition-colors"
                            title="Hapus Item"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Second Row: Actions & Metadata Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/40 pl-1.5 text-[10px]">
                        {/* Time checked metadata */}
                        <div className="text-slate-500 flex items-center gap-1.5 font-mono">
                          <Calendar size={11} /> Cek Terakhir: <span className="text-slate-400">{item.lastChecked}</span>
                        </div>

                        {/* Condition Quick Override buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-500 font-extrabold uppercase text-[8px] tracking-wide mr-1 select-none">
                            Kondisi:
                          </span>
                          <button
                            type="button"
                            onClick={() => updateItemStatus(item.id, 'good')}
                            className={`px-2 py-1 rounded font-bold transition-all text-[8px] cursor-pointer ${
                              item.status === 'good' 
                                ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 border border-transparent'
                            }`}
                          >
                            Baik
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemStatus(item.id, 'warning')}
                            className={`px-2 py-1 rounded font-bold transition-all text-[8px] cursor-pointer ${
                              item.status === 'warning' 
                                ? 'bg-amber-500/25 text-amber-400 border border-amber-500/30' 
                                : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 border border-transparent'
                            }`}
                          >
                            Cek Rutin
                          </button>
                          <button
                            type="button"
                            onClick={() => updateItemStatus(item.id, 'broken')}
                            className={`px-2 py-1 rounded font-bold transition-all text-[8px] cursor-pointer ${
                              item.status === 'broken' 
                                ? 'bg-rose-500/25 text-rose-400 border border-rose-500/30' 
                                : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 border border-transparent'
                            }`}
                          >
                            Rusak
                          </button>

                          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

                          <button
                            type="button"
                            onClick={() => checkItemNow(item.id)}
                            className="text-[8px] bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded font-bold transition-all cursor-pointer uppercase tracking-wider"
                          >
                            Verifikasi Cek
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
