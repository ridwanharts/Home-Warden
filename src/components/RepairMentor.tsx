import React, { useState } from 'react';
import { RepairDiagnosis } from '../types';
import { diagnoseRepair } from '../services/geminiService';
import { Send, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, ShoppingCart, Hammer } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onSaveResult: (result: RepairDiagnosis) => void;
}

export default function RepairMentor({ onSaveResult }: Props) {
  const [problem, setProblem] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepairDiagnosis | null>(null);

  const handleDiagnose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;

    setLoading(true);
    try {
      const diagnosis = await diagnoseRepair(problem);
      setResult(diagnosis);
      onSaveResult(diagnosis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Input Header */}
      {!result && (
        <section className="space-y-8 py-8">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
              <Sparkles size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight uppercase">DIY Repair Mentor</h2>
              <p className="text-slate-500 text-sm italic">Diagnosis & Panduan Langkah-demi-Langkah</p>
            </div>
          </div>

          <form onSubmit={handleDiagnose} className="space-y-6">
            <div className="glass-card !bg-slate-900/40 p-4">
              <textarea 
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Deskripsikan masalah Anda (misal: 'Kran dapur bocor'...)"
                rows={4}
                className="w-full bg-transparent p-2 rounded-none focus:outline-none transition-colors placeholder:text-slate-700 resize-none font-sans"
              />
            </div>
            <button 
              disabled={loading || !problem.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-indigo-500/20 transition-all uppercase tracking-tight"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  Generate Diagnosis
                  <Send size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800/50 rounded-xl p-3 text-center bg-slate-900/20">AI Engine Ready</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-800/50 rounded-xl p-3 text-center bg-slate-900/20">Precision Guide</div>
          </div>
        </section>
      )}

      {/* Result Display */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          {/* Diagnosis Hero */}
          <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20 p-8 rounded-3xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">
              <CheckCircle2 size={16} />
              Diagnosis Terverifikasi
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-4 leading-tight italic">"{result.problem}"</h3>
            <p className="text-slate-400 leading-relaxed text-sm">{result.diagnosis}</p>
          </div>

          {/* Safety Warning */}
          {result.safetyWarning && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl flex items-start gap-4">
              <AlertCircle className="text-rose-500 shrink-0" size={24} />
              <div className="space-y-1">
                <h4 className="text-rose-500 font-bold text-xs uppercase tracking-widest">Protocol Warning</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{result.safetyWarning}</p>
              </div>
            </div>
          )}

          {/* Resources Needed */}
          <div className="grid grid-cols-1 gap-6">
            <div className="glass-card !bg-slate-900/60">
              <h4 className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400 tracking-widest mb-6">
                <ShoppingCart size={18} className="text-indigo-400" />
                Daftar Belanja
              </h4>
              <ul className="space-y-3">
                {result.shoppingList.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-card !bg-slate-900/60">
              <h4 className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400 tracking-widest mb-6">
                <Hammer size={18} className="text-indigo-400" />
                Alat yang Dibutuhkan
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.toolsNeeded.map((tool, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700/50">
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Step by Step */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Instruksi Eksekusi</h4>
            <div className="space-y-2">
              {result.steps.map((step, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 rounded-xl flex items-start gap-3 group transition-all"
                >
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all shadow-sm">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs text-slate-300 leading-relaxed group-hover:text-slate-100 transition-colors">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button 
            onClick={() => setResult(null)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-500 py-4 rounded-2xl font-bold text-xs hover:border-indigo-500 hover:text-white transition-all uppercase tracking-widest"
          >
            Mulai Diagnosis Baru
          </button>
        </motion.div>
      )}
    </div>
  );
}
