import React from 'react';
import { RepairDiagnosis } from '../types';
import { History as HistoryIcon, Calendar, ArrowRight } from 'lucide-react';

interface Props {
  history: RepairDiagnosis[];
}

export default function History({ history }: Props) {
  return (
    <div className="space-y-4 pb-16">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight uppercase flex items-center gap-2">
          <HistoryIcon className="text-indigo-400" size={20} />
          Logs
        </h2>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{history.length} Entries</span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl opacity-50">
          <HistoryIcon className="mx-auto mb-4 text-slate-700" size={64} />
          <p className="text-sm font-medium text-slate-500 italic">Belum ada riwayat perbaikan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((entry, i) => (
            <div key={i} className="glass-card flex group hover:bg-slate-900/60 transition-all cursor-pointer">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  <Calendar size={12} />
                  {new Date(entry.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <h3 className="font-bold text-xl text-slate-100 group-hover:text-indigo-400 transition-colors mb-1 leading-tight">{entry.problem}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  {entry.diagnosis}
                </p>
              </div>
              <div className="flex items-center pl-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-white transition-all">
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
