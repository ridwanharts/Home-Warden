import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem } from '../types';
import { Package, Plus, Minus, Search, Wrench, Pipette as Tape, AlertTriangle, X, Camera, Image, Trash2, ArrowLeft, Check, Filter } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  inventory: InventoryItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onAddItem: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  onUpdateItem: (item: InventoryItem) => void;
  onDeleteItem?: (id: string) => void;
}

// Reusable dynamic Image Picker component with camera and file upload capability
function ImagePicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (url: string) => void; 
}) {
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Safely stop stream tracks on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
         try {
           const stream = videoRef.current.srcObject as MediaStream;
           stream.getTracks().forEach(track => track.stop());
         } catch (e) {
           console.error("Clean up error", e);
         }
      }
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setStreamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 400 }, height: { ideal: 300 } }
      });
      // Small timeout to guarantee DOM is rendered before assigning stream to ref
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error(err);
      setCameraError("Gagal membuka kamera. Pastikan izin kamera aktif & didukung di browser ini.");
      setStreamActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Compress JPEG to keep Firestore size optimal and fast
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        onChange(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error(err);
      setCameraError("Gagal mengambil foto dari feed kamera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      } catch (e) {
        console.error("Error stopping tracks", e);
      }
    }
    setStreamActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Foto Item / Gambar</label>
        {value && !streamActive && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
          >
            <Trash2 size={12} /> Hapus Foto
          </button>
        )}
      </div>
      
      {/* Visual Workspace */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video flex flex-col items-center justify-center p-2">
        {streamActive ? (
          <div className="absolute inset-0 w-full h-full bg-black flex flex-col justify-end">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex gap-3 justify-center">
              <button 
                type="button" 
                onClick={capturePhoto} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <Camera size={14} /> Bidik Foto
              </button>
              <button 
                type="button" 
                onClick={stopCamera} 
                className="bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer active:scale-95 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        ) : value ? (
          <div className="absolute inset-0 w-full h-full">
            <img 
              src={value} 
              alt="Media Preview" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="text-center p-6 flex flex-col items-center">
            <span className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 mb-2">
              <Image size={22} className="text-indigo-400/50" />
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Belum Ada Foto Terlampir</span>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="text-[10px] text-rose-400 font-semibold px-2 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
          {cameraError}
        </div>
      )}

      {/* Action triggers */}
      {!streamActive && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-indigo-400 border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
          >
            <Camera size={14} /> Ambil Dari Kamera
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-850 text-xs font-bold text-slate-300 border border-slate-800 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
          >
            <Image size={14} /> Cari Dari File
          </button>
        </div>
      )}

      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
}

const getCategoryColor = (category: string) => {
  const norm = category.toLowerCase();
  if (norm.includes('listrik')) return 'bg-amber-400';
  if (norm.includes('plumb') || norm.includes('pipa') || norm.includes('talang')) return 'bg-sky-400';
  if (norm.includes('power') || norm.includes('mesin') || norm.includes('alat berat')) return 'bg-orange-500';
  if (norm.includes('atap')) return 'bg-teal-400';
  if (norm.includes('aksesoris')) return 'bg-purple-500';
  if (norm.includes('hard') || norm.includes('kayu') || norm.includes('besi')) return 'bg-slate-400';
  return 'bg-indigo-500';
};

export default function Warehouse({ inventory, onUpdateQuantity, onAddItem, onUpdateItem, onDeleteItem }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilterCategory, setActiveFilterCategory] = useState('ALL');
  const [activeFilterType, setActiveFilterType] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  // Create Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [type, setType] = useState<'Tool' | 'Consumable'>('Tool');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Pcs');
  const [health, setHealth] = useState(100);
  const [imageUrl, setImageUrl] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Hardware');
  const [editType, setEditType] = useState<'Tool' | 'Consumable'>('Tool');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editUnit, setEditUnit] = useState('Pcs');
  const [editHealth, setEditHealth] = useState(100);
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editEntryDate, setEditEntryDate] = useState('');

  // Handle setting active edited item
  const startEditing = (item: InventoryItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditType(item.type);
    setEditQuantity(item.quantity);
    setEditUnit(item.unit);
    setEditHealth(item.health);
    setEditImageUrl(item.imageUrl || '');
    setEditEntryDate(item.entryDate || new Date().toISOString().split('T')[0]);
  };

  const filteredItems = inventory.filter(item => {
    const matchesSearch = !searchTerm.trim() || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = activeFilterCategory === 'ALL' || item.category === activeFilterCategory;
    const matchesType = activeFilterType === 'ALL' || item.type === activeFilterType;
    
    let matchesDate = true;
    if (item.entryDate) {
      if (filterStartDate) {
        matchesDate = matchesDate && item.entryDate >= filterStartDate;
      }
      if (filterEndDate) {
        matchesDate = matchesDate && item.entryDate <= filterEndDate;
      }
    } else if (filterStartDate || filterEndDate) {
      matchesDate = false;
    }
    
    return matchesSearch && matchesCategory && matchesType && matchesDate;
  });

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddItem({
      name,
      category,
      type,
      quantity,
      unit,
      health: type === 'Tool' ? health : 100,
      imageUrl: imageUrl || undefined,
      entryDate: entryDate || undefined
    });

    // Reset Form State
    setName('');
    setCategory('Hardware');
    setType('Tool');
    setQuantity(1);
    setUnit('Pcs');
    setHealth(100);
    setImageUrl('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    setIsAdding(false);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    onUpdateItem({
      ...editingItem,
      name: editName,
      category: editCategory,
      type: editType,
      quantity: editQuantity,
      unit: editUnit,
      health: editType === 'Tool' ? editHealth : 100,
      imageUrl: editImageUrl || undefined,
      entryDate: editEntryDate || undefined
    });

    setEditingItem(null);
  };

  // If in active Edit View mode, render full layout edit form
  if (editingItem) {
    return (
      <div className="space-y-6 pb-24">
        {/* Back navigation header */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditingItem(null)}
            className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer bg-indigo-500/10 border border-indigo-500/20 px-3 py-2 rounded-xl"
          >
            <ArrowLeft size={14} /> Kembali
          </button>
        </div>

        <motion.form
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          onSubmit={handleSubmitEdit}
          className="glass-card !bg-slate-900/70 p-6 space-y-5 border border-indigo-500/20"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Edit Detail Item</h3>
              <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Ubah atribut logistik dan visual SKU</p>
            </div>
            <span className="text-[9px] font-bold text-slate-500 px-2 py-0.5 border border-slate-800 rounded bg-slate-950 uppercase tracking-widest">
              ID: {editingItem.id}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Item</label>
              <input
                type="text"
                required
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="misal: Obeng Plus Tekiro..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Power Tools">Power Tools</option>
                  <option value="Kelistrikan">Kelistrikan</option>
                  <option value="Atap & Talang">Atap & Talang</option>
                  <option value="Aksesoris Rumah">Aksesoris Rumah</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Satuan/Unit</label>
                <input
                  type="text"
                  required
                  value={editUnit}
                  onChange={e => setEditUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Unit, Roll, Pcs..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipe Item</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditType('Tool')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    editType === 'Tool' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Alat (Tool)
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('Consumable')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    editType === 'Consumable' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Bahan (Consumable)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jumlah Stok</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editQuantity}
                  onChange={e => setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {editType === 'Tool' ? (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    <span>Kondisi</span>
                    <span className="text-indigo-400">{editHealth}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editHealth}
                    onChange={e => setEditHealth(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer py-3"
                  />
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-medium italic pb-3">
                  Tidak memiliki parameter kondisi (Auto 100%)
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Masuk / Pembelian</label>
              <input
                type="date"
                required
                value={editEntryDate}
                onChange={e => setEditEntryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>

            {/* Photo Picker integration */}
            <ImagePicker value={editImageUrl} onChange={setEditImageUrl} />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="py-3.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer text-slate-400 text-center"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.99] transition-all uppercase tracking-wider text-xs cursor-pointer text-center"
            >
              Simpan Perubahan
            </button>
          </div>

          {onDeleteItem && (
            <div className="pt-3 border-t border-slate-800/60 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Apakah Anda yakin ingin menghapus item "${editingItem.name}" dari Gudang secara permanen?`)) {
                    onDeleteItem(editingItem.id);
                    setEditingItem(null);
                  }
                }}
                className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 font-bold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Trash2 size={13} /> Hapus Item dari Gudang
              </button>
            </div>
          )}
        </motion.form>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-16">
      {/* Header & Search */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
            <Package className="text-indigo-400" size={20} />
            Gudang Utama
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:inline mr-1">{inventory.length} SKUs</span>
            
            {/* Toggle Search Button */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) {
                  setSearchTerm(''); // Clear text search when hidden
                }
              }}
              className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                showSearch 
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Cari Barang"
            >
              <Search size={16} />
            </button>

            {/* Toggle Filter Button */}
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                showFilter 
                  ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title="Filter Kategori"
            >
              <Filter size={16} />
            </button>

            {/* Add Item Button */}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={`flex items-center justify-center p-2 rounded-xl transition-all font-bold text-xs uppercase cursor-pointer border ${
                isAdding 
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-600/30' 
                  : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30'
              }`}
              title="Tambah Item Baru"
            >
              {isAdding ? <X size={16} /> : <Plus size={16} />}
            </button>
          </div>
        </div>
        
        {/* Collapsible Search Input */}
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.15 }}
            className="relative group overflow-hidden"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Cari alat atau bahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 py-2.5 pl-10 pr-3.5 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans text-sm backdrop-blur-sm"
              autoFocus
            />
          </motion.div>
        )}

        {/* Collapsible Filters Input */}
        {showFilter && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.15 }}
            className="glass-card !bg-slate-900/40 border border-slate-800 p-3 rounded-xl space-y-3 overflow-hidden text-left"
          >
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Filter Kategori</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { value: 'ALL', label: 'Semua' },
                  { value: 'Hardware', label: 'Hardware' },
                  { value: 'Plumbing', label: 'Plumbing' },
                  { value: 'Power Tools', label: 'Power Tools' },
                  { value: 'Kelistrikan', label: 'Kelistrikan' },
                  { value: 'Atap & Talang', label: 'Atap' },
                  { value: 'Aksesoris Rumah', label: 'Aksesoris' }
                ].map(cat => (
                  <button
                    type="button"
                    key={cat.value}
                    onClick={() => setActiveFilterCategory(cat.value)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      activeFilterCategory === cat.value
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Tipe Barang</span>
              <div className="flex gap-1.5">
                {[
                  { value: 'ALL', label: 'Semua Tipe' },
                  { value: 'Tool', label: 'Alat (Tool)' },
                  { value: 'Consumable', label: 'Bahan (Consumable)' }
                ].map(typeOpt => (
                  <button
                    type="button"
                    key={typeOpt.value}
                    onClick={() => setActiveFilterType(typeOpt.value)}
                    className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      activeFilterType === typeOpt.value
                        ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                        : 'bg-slate-950/40 text-slate-400 border-slate-800/80 hover:text-slate-200'
                    }`}
                  >
                    {typeOpt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Tanggal Masuk / Pembelian</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mulai</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hingga</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {(activeFilterCategory !== 'ALL' || activeFilterType !== 'ALL' || filterStartDate || filterEndDate) && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilterCategory('ALL');
                    setActiveFilterType('ALL');
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-[8px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider cursor-pointer"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </motion.div>
        )}
      </section>

      {/* Expandable Add Item Form */}
      {isAdding && (
        <motion.form
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          onSubmit={handleSubmitAdd}
          className="glass-card !bg-slate-900/70 p-6 space-y-4 border border-indigo-500/20"
        >
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">Tambah Item Baru</h3>
            <button type="button" onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-slate-100">
              <X size={14} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nama Item</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="misal: Obeng Plus Tekiro, Kuas Cat 3..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Kategori</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Power Tools">Power Tools</option>
                  <option value="Kelistrikan">Kelistrikan</option>
                  <option value="Atap & Talang">Atap & Talang</option>
                  <option value="Aksesoris Rumah">Aksesoris Rumah</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Satuan/Unit</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="Unit, Roll, Pcs, Box..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipe Item</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('Tool')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    type === 'Tool' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Alat (Tool)
                </button>
                <button
                  type="button"
                  onClick={() => setType('Consumable')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    type === 'Consumable' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Bahan (Consumable)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Jumlah Awal</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {type === 'Tool' ? (
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    <span>Kondisi</span>
                    <span className="text-indigo-400">{health}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={health}
                    onChange={e => setHealth(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer py-3 h-2"
                  />
                </div>
              ) : (
                <div className="text-[10px] text-slate-500 font-medium italic pb-3">
                  Tidak memiliki parameter kondisi (Auto 100%)
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Tanggal Masuk / Pembelian</label>
              <input
                type="date"
                required
                value={entryDate}
                onChange={e => setEntryDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              />
            </div>

            {/* Photo Picker integration */}
            <ImagePicker value={imageUrl} onChange={setImageUrl} />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 hover:scale-[1.01] transition-all uppercase tracking-wider text-xs cursor-pointer"
          >
            Simpan ke Gudang
          </button>
        </motion.form>
      )}

      {/* Simplified, Beautiful Inventory List & Cards */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div 
            key={item.id}
            onClick={() => startEditing(item)}
            className="glass-card !p-3.5 !pl-5 transition-all hover:bg-slate-900/60 active:scale-[0.99] cursor-pointer group flex items-center justify-between gap-4 border border-slate-800/80 hover:border-indigo-500/20 relative overflow-hidden"
          >
            {/* Color Strip/Ribbon representing Category */}
            <div className={`absolute left-0 top-0 bottom-0 w-[5px] ${getCategoryColor(item.category)}`} />
            {/* Visual Thumbnail & Metadata */}
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* Photo representation */}
              <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : item.type === 'Tool' ? (
                  <Wrench size={18} className="text-indigo-400/80" />
                ) : (
                  <Tape size={18} className="text-emerald-400/80" />
                )}
              </div>

              {/* Identity & stats info */}
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block leading-none mb-1">
                  {item.category}
                </span>
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                  {item.name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-widest ${
                    item.type === 'Tool' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  }`}>
                    {item.type === 'Tool' ? 'ALAT' : 'BAHAN'}
                  </span>
                  {item.type === 'Tool' && (
                    <span className={`text-[9px] font-bold ${item.health > 80 ? 'text-emerald-500' : item.health > 40 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {item.health}% Kondisi
                    </span>
                  )}
                  {item.entryDate && (
                    <span className="text-[9px] font-semibold text-slate-500/80 flex items-center gap-1 whitespace-nowrap">
                      • Masuk: {item.entryDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Incremental controllers with safety isolation */}
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <div className="text-right flex flex-col items-end justify-center">
                <span className="text-lg font-light text-slate-100 tracking-tight leading-none">{item.quantity}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{item.unit}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
                <button 
                  onClick={() => onUpdateQuantity(item.id, -1)}
                  className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-white transition-all rounded-lg cursor-pointer"
                  title="Kurangi Stok"
                >
                  <Minus size={13} />
                </button>
                <div className="w-px h-3.5 bg-slate-800" />
                <button 
                  onClick={() => onUpdateQuantity(item.id, 1)}
                  className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-white transition-all rounded-lg cursor-pointer"
                  title="Tambah Stok"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
            <Package className="mx-auto mb-4 text-slate-700 font-thin" size={48} />
            <p className="text-slate-400 text-sm italic">Stok untuk "{searchTerm}" tidak tersedia.</p>
          </div>
        )}
      </div>

      {/* Warning */}
      {inventory.some(i => i.type === 'Consumable' && i.quantity < 5) && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4">
          <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Peringatan: Beberapa stok menipis</p>
        </div>
      )}
    </div>
  );
}
