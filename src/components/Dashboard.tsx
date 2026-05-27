import React from 'react';
import { MaintenanceZone } from '../types';
import { ShieldCheck, AlertTriangle, Home, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  zones: MaintenanceZone[];
  onInspect?: () => void;
}

export default function Dashboard({ zones, onInspect }: Props) {
  const averageScore = Math.round(zones.reduce((acc, z) => acc + z.score, 0) / zones.length);

  const getScoreColor = (score: number) => {
    if (score > 80) return 'text-emerald-500';
    if (score > 60) return 'text-indigo-400';
    return 'text-rose-500';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Home Health Score */}
      <section className="bg-gradient-to-br from-indigo-600/20 to-slate-900 border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Home Health Score</h2>
            <ShieldCheck className="text-indigo-400" size={20} />
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className={`text-6xl font-thin ${getScoreColor(averageScore)}`}>
              {averageScore}%
            </span>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-tighter">Operational</span>
          </div>

          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Sistem berfungsi optimal. {zones.filter(z => z.score < 80).length} zona butuh perhatian khusus.
          </p>

          <div className="mt-6 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${averageScore}%` }}
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>
      </section>

      {/* Maintenance Zones */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Active Zones</h3>
        {zones.map((zone) => (
          <motion.div 
            key={zone.id}
            whileTap={{ scale: 0.98 }}
            className="glass-card flex justify-between items-center py-5 px-6"
          >
            <div>
              <h4 className="font-bold text-lg text-slate-100">{zone.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase">
                  Service {new Date(zone.lastMaintained).toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-light ${getScoreColor(zone.score)}`}>
                {zone.score}%
              </div>
              {zone.score < 80 && (
                <div className="flex items-center text-[10px] text-indigo-400 gap-1 font-bold">
                  <AlertTriangle size={10} />
                  CRITICAL
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Action */}
      <button 
        onClick={onInspect}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all uppercase tracking-tight cursor-pointer active:scale-95"
      >
        <Home size={20} />
        Mulai Inspeksi Sistem
      </button>
    </div>
  );
}
