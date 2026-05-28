import React, { useState } from 'react';
import { RepairDiagnosis } from '../types';
import { diagnoseRepair } from '../services/geminiService';
import { 
  Send, Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, 
  ShoppingCart, Hammer, ArrowLeft, ArrowRight, Check, HelpCircle, 
  Compass, ClipboardCheck, Trash2, Edit3, HelpCircle as HelpIcon,
  Droplet, Zap, Home, Move, Settings, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onSaveResult: (result: RepairDiagnosis) => void;
  onAddShoppingItem?: (name: string) => void;
}

// Option Lists for the Guided Wizard
const categories = [
  { id: 'water', label: '🚿 Saluran Air / Saniter', desc: 'Pipa bocor, kran rusak, toilet mampet, wastafel, selang air', icon: Droplet },
  { id: 'electrical', label: '⚡ Arus Listrik & Lampu', desc: 'Stopkontak mati, saklar longgar, lampu korslet, sekering putus', icon: Zap },
  { id: 'building', label: '🏠 Atap, Dinding & Plafon', desc: 'Rumah bocor, dinding retak, plafon lapuk, semen rontok', icon: Home },
  { id: 'furniture', label: '🚪 Pintu, Jendela & Furnitur', desc: 'Engsel pintu macet, kunci pintu dol, laci rusak, meja goyang', icon: Move },
  { id: 'appliances', label: '🔌 Elektronik & Pompa Air', desc: 'Pompa mati, kipas goyang, mesin cuci bising, dispenser bocor', icon: Settings },
];

const symptoms = [
  { id: 'leak', label: '💦 Bocor / Merembes / Banjir', desc: 'Air keluar terus-menerus atau ada rembesan lembab' },
  { id: 'no_power', label: '🛑 Mati Total / Korslet / Padam', desc: 'Arus terputus, mati mendadak, atau ada bau terbakar' },
  { id: 'stuck', label: '🔒 Macet / Seret / Kunci Dol', desc: 'Engsel berdecit kencang, gagang longgar, sulit dibuka' },
  { id: 'crack', label: '🧱 Keretakan / Pecah / Rapuk', desc: 'Kerusakan semen, dinding retak rambut, kayu keropos' },
  { id: 'noise', label: '🔊 Berisik / Getaran Berlebih', desc: 'Suara mendengung keras atau bergetar tidak wajar' },
  { id: 'clogged', label: '🕳️ Mampet / Penyumbatan', desc: 'Saluran air tersumbat kotoran, air tergenang lama' },
];

const locations = [
  { id: 'bathroom', label: '🛁 Kamar Mandi & Toilet' },
  { id: 'kitchen', label: '🍳 Dapur & Ruang Cuci' },
  { id: 'living', label: '🛋️ Ruang Tamu / Keluarga' },
  { id: 'bedroom', label: '🛏️ Kamar Tidur' },
  { id: 'roof', label: '🏠 Atap / Plafon / Area Luar' },
  { id: 'yard', label: '🚗 Garasi / Teras / Halaman' },
];

const urgencies = [
  { id: 'emergency', label: '🚨 Darurat / Gawat', desc: 'Bisa memicu banjir, korsleting parah, atau berbahaya bagi keluarga', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5 hover:border-rose-500/40' },
  { id: 'important', label: '⚠️ Penting / Segera', desc: 'Sangat mengganggu fungsi harian dan harus segera diservis', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40' },
  { id: 'casual', label: '☕ Ringan / Kapan-kapan', desc: 'Bisa dikerjakan senggang pas hari libur sambil ngopi santai', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40' },
];

export default function RepairMentor({ onSaveResult, onAddShoppingItem }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RepairDiagnosis | null>(null);
  const [addedShoppingIndexes, setAddedShoppingIndexes] = useState<number[]>([]);

  // Mode: 'guide' (Step-by-step Wizard) or 'free' (Manual free-form write-up)
  const [inputMode, setInputMode] = useState<'guide' | 'free'>('guide');

  // Manual input state
  const [freeProblem, setFreeProblem] = useState('');

  // Wizard States
  const [wizardStep, setWizardStep] = useState(1);
  const [selCategory, setSelCategory] = useState('');
  const [selSymptom, setSelSymptom] = useState('');
  const [selLocation, setSelLocation] = useState('');
  const [selUrgency, setSelUrgency] = useState('');
  const [extraNotes, setExtraNotes] = useState('');

  // Generated compiled problem based on selections
  const getCompiledProblemText = () => {
    const catObj = categories.find(c => c.id === selCategory);
    const symObj = symptoms.find(s => s.id === selSymptom);
    const locObj = locations.find(l => l.id === selLocation);
    const urgObj = urgencies.find(u => u.id === selUrgency);

    const parts = [];
    if (catObj) parts.push(`Kategori keahlian: ${catObj.label}`);
    if (symObj) parts.push(`Gejala masalah: ${symObj.label}`);
    if (locObj) parts.push(`Lokasi spesifik: ${locObj.label}`);
    if (urgObj) parts.push(`Tingkat urgent: ${urgObj.label.split(' ').slice(1).join(' ') || urgObj.label}`);
    if (extraNotes.trim()) parts.push(`Deskripsi spesifik kejadian: "${extraNotes.trim()}"`);

    return parts.join('. ') || 'Masalah rumah tangga umum';
  };

  const currentCompiledText = getCompiledProblemText();

  // Unified Diagnose submit handler
  const handleDiagnose = async (problemDescription: string) => {
    if (!problemDescription.trim()) return;

    setLoading(true);
    try {
      const diagnosis = await diagnoseRepair(problemDescription);
      setResult(diagnosis);
      onSaveResult(diagnosis);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeProblem.trim()) return;
    handleDiagnose(freeProblem);
  };

  const handleWizardSubmit = () => {
    handleDiagnose(currentCompiledText);
  };

  const resetWizard = () => {
    setWizardStep(1);
    setSelCategory('');
    setSelSymptom('');
    setSelLocation('');
    setSelUrgency('');
    setExtraNotes('');
  };

  const isStepValid = () => {
    if (wizardStep === 1) return !!selCategory;
    if (wizardStep === 2) return !!selSymptom;
    if (wizardStep === 3) return !!selLocation;
    if (wizardStep === 4) return !!selUrgency;
    return true; // Step 5 is custom notes (optional)
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Input Header & Selection */}
      {!result && (
        <section className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shadow-inner">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight uppercase text-amber-500 flex items-center justify-center gap-2">
                Asisten DIY Bapak
              </h2>
              <p className="text-slate-400 text-xs font-medium">Temukan Solusi & Petunjuk Perbaikan Handal Secara Instan</p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-900/60 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setInputMode('guide')}
              className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                inputMode === 'guide'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Compass size={14} />
              Ikuti Panduan
            </button>
            <button
              type="button"
              onClick={() => setInputMode('free')}
              className={`py-2 px-3 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                inputMode === 'free'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
              }`}
            >
              <Edit3 size={14} />
              Tulis Bebas
            </button>
          </div>

          <AnimatePresence mode="wait">
            {inputMode === 'free' ? (
              // FREE FORM MODE
              <motion.form 
                key="free-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleManualSubmit} 
                className="space-y-4"
              >
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Jelaskan Masalah Anda Secara Singkat</span>
                  <textarea 
                    value={freeProblem}
                    onChange={(e) => setFreeProblem(e.target.value)}
                    placeholder="Contoh: 'Atap dapur bocor merembes lewat sela plafon triplek pas hujan deras kemarin sore. Plafonnya jadi rapuh sekarang...'"
                    rows={4}
                    className="w-full bg-transparent p-1 rounded-none focus:outline-none transition-colors placeholder:text-slate-600 resize-none font-sans text-xs sm:text-sm text-slate-100"
                  />
                </div>
                <button 
                  disabled={loading || !freeProblem.trim()}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-indigo-500/10 transition-all uppercase tracking-wider text-xs"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      Kirim Diagnosa Manual
                      <Send size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              // GUIDED WIZARD MODE
              <motion.div
                key="guided-wizard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-5"
              >
                {/* Step Indicator */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase font-bold tracking-wider">
                      Langkah {wizardStep} dari 5
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {wizardStep === 1 && "Pilih Kategori"}
                      {wizardStep === 2 && "Tentukan Gejala"}
                      {wizardStep === 3 && "Lokasi Kerusakan"}
                      {wizardStep === 4 && "Urgensi / Kegentingan"}
                      {wizardStep === 5 && "Catatan Tambahan"}
                    </span>
                  </div>
                  {wizardStep > 1 && (
                    <button 
                      type="button" 
                      onClick={resetWizard}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-400 uppercase tracking-widest flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10"
                    >
                      <Trash2 size={10} /> Reset
                    </button>
                  )}
                </div>

                {/* Progress Mini Bar */}
                <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-300"
                    style={{ width: `${(wizardStep / 5) * 100}%` }}
                  />
                </div>

                <div className="min-h-[220px]">
                  {/* STEP 1: CATEGORY */}
                  {wizardStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium px-0.5">Kerusakan terjadi di bagian apa bapak?</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {categories.map((c) => {
                          const Icon = c.icon;
                          const isSelected = selCategory === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelCategory(c.id);
                                setTimeout(() => setWizardStep(2), 200); // Friendly auto-progress
                              }}
                              className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 group relative overflow-hidden ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-md shadow-indigo-500/5' 
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                              }`}
                            >
                              <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-950 text-slate-400 group-hover:text-slate-200'}`}>
                                <Icon size={16} />
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-400' : 'text-slate-200 group-hover:text-slate-100'}`}>{c.label}</span>
                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{c.desc}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check size={10} className="text-white font-extrabold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: SYMPTOM */}
                  {wizardStep === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium px-0.5">Gejala utama yang paling terlihat:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {symptoms.map((s) => {
                          const isSelected = selSymptom === s.id;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelSymptom(s.id);
                                setTimeout(() => setWizardStep(3), 200);
                              }}
                              className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 group relative overflow-hidden ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-md shadow-indigo-500/5' 
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0">
                                <span className={`text-xs font-bold block ${isSelected ? 'text-indigo-400' : 'text-slate-200 group-hover:text-slate-100'}`}>{s.label}</span>
                                <p className="text-[10px] text-slate-500 leading-relaxed">{s.desc}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check size={10} className="text-white font-extrabold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: LOCATION */}
                  {wizardStep === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium px-0.5">Di ruangan mana barang tersebut berada?</p>
                      <div className="grid grid-cols-2 gap-2">
                        {locations.map((l) => {
                          const isSelected = selLocation === l.id;
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                setSelLocation(l.id);
                                setTimeout(() => setWizardStep(4), 200);
                              }}
                              className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between group relative overflow-hidden ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100' 
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                              }`}
                            >
                              <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-400 font-bold' : 'text-slate-200 group-hover:text-slate-100'}`}>{l.label}</span>
                              {isSelected ? (
                                <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check size={10} className="text-white font-extrabold" />
                                </div>
                              ) : (
                                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: URGENCY */}
                  {wizardStep === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-xs text-slate-400 font-medium px-0.5">Tingkat kepentingan penanganan kerusakan:</p>
                      <div className="space-y-2">
                        {urgencies.map((u) => {
                          const isSelected = selUrgency === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setSelUrgency(u.id);
                                setTimeout(() => setWizardStep(5), 200);
                              }}
                              className={`p-3 w-full rounded-xl text-left border transition-all flex items-start gap-3 group relative overflow-hidden ${
                                isSelected 
                                  ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow-md shadow-indigo-500/5' 
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60'
                              } ${u.color}`}
                            >
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <span className="text-xs font-bold block">{u.label}</span>
                                <p className="text-[10px] text-slate-500 leading-relaxed">{u.desc}</p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                                  <Check size={10} className="text-white font-extrabold" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: REVIEW & NOTES */}
                  {wizardStep === 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-medium px-0.5">Ada catatan tambahan yang ingin bapak tambahkan? (Opsional)</p>
                        <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                          <textarea
                            value={extraNotes}
                            onChange={(e) => setExtraNotes(e.target.value)}
                            placeholder="Contoh: 'Keran merek Toto kuningan, air ngalir terus meski gagang sudah diputar kencang-kencang...'"
                            rows={2}
                            className="w-full bg-transparent p-1 focus:outline-none placeholder:text-slate-700 resize-none font-sans text-xs text-slate-100"
                          />
                        </div>
                      </div>

                      {/* Prompt Formulated Review Card */}
                      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <ClipboardCheck size={12} className="text-amber-500" /> Formulasi Deskripsi Masalah
                        </span>
                        <div className="text-xs text-slate-300 leading-relaxed font-sans italic bg-slate-950/40 p-2.5 rounded border border-slate-900 text-[11px] sm:text-xs">
                          "{currentCompiledText}"
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          <Info size={10} className="inline mr-1 text-slate-500" />
                          Kami telah mengonversi pilihan bapak menjadi kalimat deskriptif agar analisis kecerdasan AI kami mencapai presisi tertinggi.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Wizard Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    disabled={wizardStep === 1}
                    onClick={() => setWizardStep(prev => prev - 1)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all flex items-center justify-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={13} />
                    Kembali
                  </button>

                  {wizardStep < 5 ? (
                    <button
                      type="button"
                      disabled={!isStepValid()}
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Lanjut
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading || !isStepValid()}
                      onClick={handleWizardSubmit}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed group shadow-lg shadow-amber-500/10"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <>
                          <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
                          Diagnose AI
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Engine Status Indicator Footer */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider border border-slate-800/40 rounded-lg p-2 text-center bg-slate-900/10 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Core Aktif
            </div>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider border border-slate-800/40 rounded-lg p-2 text-center bg-slate-900/10 flex items-center justify-center gap-1">
              🛠️ Panduan Presisi
            </div>
          </div>
        </section>
      )}

      {/* Result Display */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          {/* Diagnosis Hero */}
          <div className="bg-gradient-to-br from-indigo-600/10 to-transparent border border-indigo-500/20 p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-2.5">
              <CheckCircle2 size={16} />
              Diagnosis Terverifikasi
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-150 mb-3 leading-relaxed italic bg-slate-950/30 p-2.5 rounded border border-slate-900 text-slate-300">
              "{result.problem}"
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs">{result.diagnosis}</p>
          </div>

          {/* Safety Warning */}
          {result.safetyWarning && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-rose-500 shrink-0 select-none" size={20} />
              <div className="space-y-1">
                <h4 className="text-rose-500 font-bold text-[10px] uppercase tracking-widest">PROTOKOL KESELAMATAN</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{result.safetyWarning}</p>
              </div>
            </div>
          )}

          {/* Resources Needed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card !bg-slate-900/60 p-4 border border-slate-850">
              <h4 className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-850 pb-2">
                <ShoppingCart size={15} className="text-indigo-400" />
                Daftar Belanja
              </h4>
              <ul className="space-y-2">
                {result.shoppingList && result.shoppingList.length > 0 ? (
                  result.shoppingList.map((item, i) => {
                    const isAdded = addedShoppingIndexes.includes(i);
                    return (
                      <li key={i} className="flex items-center justify-between gap-2.5 text-xs text-slate-300 bg-slate-950/20 p-2 rounded-lg border border-slate-900">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                        {onAddShoppingItem && (
                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() => {
                              onAddShoppingItem(item);
                              setAddedShoppingIndexes([...addedShoppingIndexes, i]);
                            }}
                            className={`py-1 px-2.5 rounded-md font-extrabold text-[9px] uppercase tracking-wider transition-all select-none whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                              isAdded 
                                ? 'bg-slate-950 text-slate-600 border border-slate-900'
                                : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/40 hover:text-white'
                            }`}
                          >
                            {isAdded ? '✓ Ditambahkan' : '+ Belanja'}
                          </button>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li className="text-xs text-slate-500 italic">Tidak ada bahan belanja tambahan yang diperlukan</li>
                )}
              </ul>
            </div>

            <div className="glass-card !bg-slate-900/60 p-4 border border-slate-850">
              <h4 className="flex items-center gap-3 text-xs font-bold uppercase text-slate-400 tracking-widest mb-3 border-b border-slate-850 pb-2">
                <Hammer size={15} className="text-indigo-400" />
                Alat yang Dibutuhkan
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.toolsNeeded && result.toolsNeeded.length > 0 ? (
                  result.toolsNeeded.map((tool, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-semibold text-slate-300 border border-slate-700/50">
                      🔧 {tool}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Cukup pakai alat-alat standar yang dirumah</span>
                )}
              </div>
            </div>
          </div>

          {/* Step by Step */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">Langkah Demi Langkah Perbaikan</h4>
            <div className="space-y-2">
              {result.steps && result.steps.map((step, i) => (
                <div 
                  key={i} 
                  className="p-3 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-850 rounded-xl flex items-start gap-3 group transition-all"
                >
                  <div className="shrink-0 w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all shadow-sm select-none">
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
            type="button"
            onClick={() => {
              setResult(null);
              setAddedShoppingIndexes([]);
            }}
            className="w-full bg-slate-900 border border-slate-850 text-slate-400 py-3.5 rounded-2xl font-bold text-xs hover:border-amber-500 hover:text-white transition-all uppercase tracking-widest mt-4"
          >
            Mendapatkan Solusi untuk Masalah Lain
          </button>
        </motion.div>
      )}
    </div>
  );
}

