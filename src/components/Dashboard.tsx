import React from 'react';
import { MaintenanceZone, InventoryItem, HouseRoom, RepairDiagnosis, View } from '../types';
import {
  ShieldCheck,
  AlertTriangle,
  Home,
  Package,
  Wrench,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  zones: MaintenanceZone[];
  inventory: InventoryItem[];
  rooms: HouseRoom[];
  history: RepairDiagnosis[];
  onInspect?: () => void;
  onNavigate?: (view: View) => void;
}

export default function Dashboard({
  zones,
  inventory = [],
  rooms = [],
  history = [],
  onInspect,
  onNavigate
}: Props) {
  // 1. Calculate General Health Score
  const averageZoneScore = zones.length > 0
    ? Math.round(zones.reduce((acc, z) => acc + z.score, 0) / zones.length)
    : 100;

  // 2. Count Room Items Statuses
  let totalRoomItems = 0;
  let brokenRoomItemsCount = 0;
  let warningRoomItemsCount = 0;
  let goodRoomItemsCount = 0;

  rooms.forEach(room => {
    (room.items || []).forEach(item => {
      totalRoomItems++;
      if (item.status === 'broken') brokenRoomItemsCount++;
      else if (item.status === 'warning') warningRoomItemsCount++;
      else goodRoomItemsCount++;
    });
  });

  // Calculate Weighted System Health
  // Deduct 15 pts for each broken item, 5 pts for each warning item
  let healthPenalties = (brokenRoomItemsCount * 15) + (warningRoomItemsCount * 5);
  const homeSystemHealth = Math.max(30, Math.min(100, averageZoneScore - healthPenalties));

  // 3. Count Inventory Metrics
  const totalInventoryItems = inventory.length;
  const criticalStockCount = inventory.filter(item => item.quantity === 0).length;
  const lowHealthTools = inventory.filter(item => item.type === 'Tool' && item.health < 60).length;

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-emerald-400';
    if (score > 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getScoreBg = (score: number) => {
    if (score > 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (score > 60) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
  };

  return (
    <div className="space-y-6 pb-24 text-slate-100">
      {/* Dynamic Security & Alert Banner */}
      <div className="flex flex-col gap-2">
        {brokenRoomItemsCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
          >
            <AlertCircle size={14} className="shrink-0 animate-pulse" />
            <span>
              Terdeteksi <b>{brokenRoomItemsCount} barang rusak</b> di salah satu ruangan yang mendesak untuk diperbaiki.
            </span>
          </motion.div>
        ) : warningRoomItemsCount > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
          >
            <AlertTriangle size={14} className="shrink-0" />
            <span>
              Perhatian: Ada <b>{warningRoomItemsCount} barang butuh pengecekan</b> berkala di dalam ruangan Anda.
            </span>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
          >
            <ShieldCheck size={14} className="shrink-0" />
            <span>Semua ruangan & perangkat rumah berada dalam kondisi optimal dan aman.</span>
          </motion.div>
        )}
      </div>

      {/* Main Combined System Score & Quick Action Banner */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-5 sm:p-6 rounded-2xl sm:rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 w-36 h-36 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header & Score Row */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Live Health Index</span>
              <Activity className="text-indigo-400 animate-pulse" size={11} />
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-4xl sm:text-5xl font-black leading-none tracking-tight ${getScoreColor(homeSystemHealth)}`}>
                {homeSystemHealth}%
              </span>
              <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">SKOR INTEGRITAS</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase mt-1 leading-none font-medium">MANDOR ENGINE v1.2</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
            Skor gabungan dihitung dari status aktif berkala {zones.length} Zona Utama, ketersediaan gudang, serta kondisi inventori di {rooms.length} Ruangan Anda.
          </p>

          {/* Button & Subtext Under Description */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-1">
            <button
              onClick={onInspect}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 transition-all text-center cursor-pointer active:scale-95 w-full sm:w-auto shrink-0"
            >
              <ShieldCheck size={14} className="shrink-0" />
              Setel Ulang Zona Inspeksi
            </button>
            <span className="text-[9px] font-mono text-slate-500 text-center sm:text-left">
              Mulai ulang jadwal inspeksi berkala.
            </span>
          </div>
        </div>

        <div className="mt-5 h-1 bg-slate-800/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${homeSystemHealth}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]"
          />
        </div>
      </section>

      {/* Bento Grid: Core System Modules */}
      <div>
        <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 px-1">
          Bento Modular Dashboard
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          
          {/* Card A: Ruangan & Tata Letak */}
          <motion.div
            whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.2)' }}
            onClick={() => onNavigate?.('rooms')}
            className="col-span-2 sm:col-span-1 bg-slate-900/40 border border-slate-900/80 p-4.5 rounded-2xl transition-all cursor-pointer hover:bg-slate-900/60 flex flex-col justify-between min-h-[135px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                  <Home size={15} />
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  MODULE RUANGAN
                </div>
              </div>
              <h4 className="font-bold text-slate-200 mt-2.5 text-xs sm:text-sm">Tata Ruang & Item Aktif</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                Pantau kondisi fisik tiap ruangan secara berkala.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/30 pt-2 mt-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                {rooms.length} Ruang • {totalRoomItems} Barang
              </span>
              <span className="text-[9px] text-indigo-400 font-bold flex items-center gap-0.5 group">
                Buka <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </motion.div>

          {/* Card B: Warehouse & Inventory */}
          <motion.div
            whileHover={{ y: -2, borderColor: 'rgba(99, 102, 241, 0.2)' }}
            onClick={() => onNavigate?.('warehouse')}
            className="col-span-2 sm:col-span-1 bg-slate-900/40 border border-slate-900/80 p-4.5 rounded-2xl transition-all cursor-pointer hover:bg-slate-900/60 flex flex-col justify-between min-h-[135px]"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="p-1.5 rounded-lg bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                  <Package size={15} />
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  MODULE GUDANG
                </div>
              </div>
              <h4 className="font-bold text-slate-200 mt-2.5 text-xs sm:text-sm">Logistik & Gudang Utama</h4>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                Stok bahan pakai habis dan kesehatan alat/kakas kerja.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/30 pt-2 mt-2">
              <div className="flex gap-2">
                <span className="text-[9px] text-slate-500 font-bold uppercase font-mono">
                  {totalInventoryItems} Jenis
                </span>
                {criticalStockCount > 0 && (
                  <span className="text-[8px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 rounded font-mono">
                    {criticalStockCount} Habis
                  </span>
                )}
              </div>
              <span className="text-[9px] text-indigo-400 font-bold flex items-center gap-0.5 group">
                Buka <ArrowRight size={10} />
              </span>
            </div>
          </motion.div>

          {/* Card C: AI Sparkles Callout (Full width on grid) */}
          <motion.div
            whileHover={{ y: -2, borderColor: 'rgba(168, 85, 247, 0.2)' }}
            onClick={() => onNavigate?.('repair')}
            className="col-span-2 bg-gradient-to-r from-indigo-950/20 via-slate-900 to-indigo-950/20 border border-indigo-500/5 p-4 rounded-2xl transition-all cursor-pointer hover:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ml-0 mr-0"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-200">
                    AI Repair Mentor & Diagnosis
                  </h4>
                  <span className="text-[7px] sm:text-[8px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold px-1 rounded uppercase tracking-wider">
                    Powered by AI
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tanyakan masalah kelistrikan, air Bocor, kunci rusak, atau tutorial servis manual.
                </p>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] text-purple-400 font-bold shrink-0 flex items-center justify-center sm:justify-start gap-1 uppercase tracking-wider pt-2 sm:pt-0 border-t sm:border-t-0 sm:border-l border-slate-800/80 sm:pl-4">
              KONSULTASI <ArrowRight size={10} />
            </span>
          </motion.div>
        </div>
      </div>

      {/* Active Maintenance Zones Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Jadwal Pemeliharaan Berkala
          </h3>
          <span className="text-[9px] font-mono text-slate-500">{zones.length} Zona Dipantau</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-slate-900/30 border border-slate-900/60 rounded-2xl py-4 px-5 flex flex-col justify-between gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-slate-200">{zone.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar size={10} />
                      Inspeksi Terakhir: {new Date(zone.lastMaintained).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-800" />
                    <span className="text-[9px] text-slate-500 font-mono">
                      Interval {zone.intervalMonths} Bulan
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${getScoreBg(zone.score)}`}>
                  {zone.score}%
                </span>
              </div>

              {/* Minimalist Progress Meter */}
              <div className="space-y-1">
                <div className="h-1 bg-slate-800/40 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${zone.score}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      zone.score > 80 ? 'bg-emerald-500' : zone.score > 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                  />
                </div>
                {zone.tasks && zone.tasks.length > 0 && (
                  <div className="text-[9px] text-slate-400 capitalize truncate max-w-sm">
                    Tugas utama: {zone.tasks.slice(0, 3).join(', ')}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Diagnostic Actions Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Arsip Diagnosis Terbaru
          </h3>
          <button
            onClick={() => onNavigate?.('history')}
            className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 flex items-center gap-0.5 cursor-pointer"
          >
            Lihat Semua <ArrowRight size={10} />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-900/25 border border-slate-900 border-dashed rounded-2xl p-6 text-center text-xs text-slate-500">
            <Clock size={20} className="mx-auto text-slate-600 mb-1.5" />
            Belum ada riwayat perbaikan aktif. Konsultasikan dengan AI Mentor untuk mendaftarkan perbaikan Anda.
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 2).map((item, index) => (
              <div
                key={index}
                onClick={() => onNavigate?.('history')}
                className="bg-slate-900/30 border border-slate-900 hover:border-slate-800/80 p-4 rounded-xl cursor-pointer transition-all flex items-start gap-3"
              >
                <div className="p-1.5 rounded-lg bg-indigo-500/5 text-indigo-400 border border-indigo-500/10 shrink-0 mt-0.5">
                  <Wrench size={12} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-200 truncate">{item.problem}</span>
                    <span className="text-[9px] font-mono text-slate-500 shrink-0">
                      {new Date(item.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                    {item.diagnosis}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {item.toolsNeeded?.slice(0, 2).map((tool, tIdx) => (
                      <span key={tIdx} className="text-[8px] bg-slate-950 text-slate-400 border border-slate-800/60 px-1.5 py-0.5 rounded font-mono uppercase">
                        {tool}
                      </span>
                    ))}
                    {item.steps && (
                      <span className="text-[8px] text-indigo-300 font-mono ml-auto">
                        {item.steps.length} Langkah Solusi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
