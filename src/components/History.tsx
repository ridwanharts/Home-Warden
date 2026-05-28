import React, { useState } from 'react';
import { RepairDiagnosis } from '../types';
import { 
  History as HistoryIcon, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  X, 
  ShoppingCart, 
  Hammer, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  history: RepairDiagnosis[];
  onDeleteHistory: (id: string) => void;
}

export default function History({ history, onDeleteHistory }: Props) {
  const [selectedEntry, setSelectedEntry] = useState<RepairDiagnosis | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Apakah Anda yakin ingin menghapus arsip diagnosis ini?')) {
      onDeleteHistory(id);
      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }
    }
  };

  return (
    <div className="space-y-4 pb-20 text-slate-100">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
          <HistoryIcon className="text-indigo-400" size={20} />
          Arsip Diagnosis
        </h2>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{history.length} Logs</span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 border-2 border-dashed border-slate-800/80 rounded-3xl opacity-60">
          <HistoryIcon className="mx-auto mb-4 text-slate-700 animate-pulse" size={48} />
          <p className="text-sm font-medium text-slate-500 italic">Belum ada riwayat perbaikan.</p>
          <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto">Diagnosis yang Anda buat melalui Menu Reparasi akan tercatat di sini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => (
            <div 
              key={entry.id} 
              onClick={() => setSelectedEntry(entry)}
              className="bg-slate-900/40 border border-slate-900/80 p-4.5 rounded-2xl flex group hover:bg-slate-900/60 transition-all cursor-pointer items-start gap-4 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-indigo-500 transition-all" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">
                  <Calendar size={11} className="text-slate-600" />
                  {new Date(entry.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-200 group-hover:text-indigo-400 transition-colors mb-1 truncate leading-tight">
                  {entry.problem}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {entry.diagnosis}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.toolsNeeded?.slice(0, 2).map((tool, tIdx) => (
                    <span key={tIdx} className="text-[8px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-500 border border-slate-900 font-mono uppercase">
                      {tool}
                    </span>
                  ))}
                  {entry.steps && (
                    <span className="text-[8px] text-indigo-400 font-mono font-bold mt-0.5 ml-auto">
                      {entry.steps.length} Langkah Solusi
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 shrink-0 justify-between self-stretch">
                <button
                  onClick={(e) => handleDelete(entry.id, e)}
                  className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent hover:border-rose-500/20 cursor-pointer"
                  title="Hapus Diagnosis"
                >
                  <Trash2 size={14} />
                </button>
                <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/20 border border-slate-900 transition-all mt-auto">
                  <ArrowRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exquisite Full Details Modal/Overlay */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
            {/* Modal Backdrop click */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              className="absolute inset-0"
            />

            {/* Modal Content container */}
            <motion.div 
              initial={{ y: '100%', opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative bg-slate-900 border-t sm:border border-slate-800 w-full sm:max-w-md sm:rounded-2xl max-h-[90vh] sm:max-h-[80vh] flex flex-col shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-900 bg-opacity-70 backdrop-blur">
                <div className="min-w-0 pr-4">
                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-indigo-400">
                    Detail Diagnosis • {new Date(selectedEntry.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-100 truncate mt-0.5">
                    {selectedEntry.problem}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={(e) => handleDelete(selectedEntry.id, e)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-rose-500/10"
                    title="Hapus Diagnosis"
                  >
                    <Trash2 size={15} />
                  </button>
                  <button 
                    onClick={() => setSelectedEntry(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Body (scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8 scrollbar-thin">
                {/* Hero / Explanation */}
                <div className="bg-indigo-950/20 border border-indigo-500/10 p-4.5 rounded-xl">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                    <CheckCircle2 size={13} />
                    Diagnosis AI
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedEntry.diagnosis}
                  </p>
                </div>

                {/* Safety Warning */}
                {selectedEntry.safetyWarning && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-0.5">
                      <h4 className="text-rose-500 font-extrabold text-[9px] uppercase tracking-wider font-mono">Peringatan Keselamatan</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedEntry.safetyWarning}</p>
                    </div>
                  </div>
                )}

                {/* Shopping List & Tools Needed */}
                <div className="grid grid-cols-1 gap-3">
                  {selectedEntry.shoppingList && selectedEntry.shoppingList.length > 0 && (
                    <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2.5 font-mono">
                        <ShoppingCart size={13} className="text-indigo-400" />
                        Bahan yang Diperlukan
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedEntry.shoppingList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedEntry.toolsNeeded && selectedEntry.toolsNeeded.length > 0 && (
                    <div className="border border-slate-800 bg-slate-950/40 p-4 rounded-xl">
                      <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2.5 font-mono">
                        <Hammer size={13} className="text-indigo-400" />
                        Alat Perkakas Kerja
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.toolsNeeded.map((tool, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-medium text-slate-300 border border-slate-700/50">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Steps */}
                {selectedEntry.steps && selectedEntry.steps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1 font-mono">
                      Langkah-Langkah Perbaikan
                    </h4>
                    <div className="space-y-2">
                      {selectedEntry.steps.map((step, i) => (
                        <div key={i} className="p-3 bg-slate-950/20 border border-slate-800/60 rounded-xl flex items-start gap-2.5">
                          <div className="shrink-0 w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-[10px] text-indigo-400">
                            {i + 1}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
