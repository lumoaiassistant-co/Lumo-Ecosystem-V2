import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, User, ShieldCheck, Loader2, KeyRound, X } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { settingsService } from '../../../services/settingsService';
import { dashboardService } from '../../../services/dashboardService';
import { quizService } from '../../../services/quizService'; 
import { UserProfile } from '../../../types/auth';

export default function ParentSettings() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [parent, setParent] = useState<Partial<UserProfile> | null>(null);
  const hasFetchedInitial = useRef(false);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [settings, userData] = await Promise.all([
        settingsService.getSettings(),
        dashboardService.getUserMe()
      ]);
      
      if (!hasFetchedInitial.current) {
        setTheme(settings.theme as 'light' | 'dark' | 'auto');
        hasFetchedInitial.current = true;
      }
      
      setParent(userData);
    } catch (err) {
      console.error("Error loading parent settings", err);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    setSavingTheme(true);
    try {
      // ✅ ده السطر اللي هيثبت الـ Theme في الداتابيز وما يخليهوش يرجع Auto
      await settingsService.updateSettings({ theme: newTheme });
    } catch {
      console.error("Failed to save theme settings");
    } finally {
      setSavingTheme(false);
    }
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4) {
      alert("PIN must be exactly 4 digits");
      return;
    }
    try {
      setIsSavingPin(true);
      const success = await quizService.updatePin(newPin);
      if (success) {
        setIsPinModalOpen(false);
        setNewPin("");
        loadData();
      }
    } catch { 
      alert("Failed to update PIN. Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin w-12 h-12 text-purple-600" />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="w-full space-y-8 pb-20 pt-0"
    >
      <header className="mb-10">
        <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-white flex items-center gap-3">
          Account Settings <span className="text-2xl">⚙️</span>
        </h1>
        <p className="text-gray-500 font-medium">Manage your personal profile and app preferences</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-8">
          {/* --- Personal Information Section --- */}
          <section className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/20 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <User size={20} className="text-blue-600" />
              </div>
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 ml-1 uppercase">Full Name</label>
                <div className="p-5 bg-white/50 dark:bg-gray-900/50 rounded-3xl font-bold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-inner">
                  {parent ? `${parent.firstName} ${parent.lastName}` : '---'}
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 ml-1 uppercase">Email Address</label>
                <div className="p-5 bg-white/50 dark:bg-gray-900/50 rounded-3xl font-bold text-gray-400 border border-gray-100 dark:border-gray-700 shadow-inner">
                  {parent?.email || '---'}
                </div>
              </div>
            </div>
          </section>

          {/* --- Privacy Controls Section --- */}
          <section className="bg-gradient-to-r from-purple-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-2xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-inner">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Privacy Controls</h3>
                <p className="opacity-80 text-sm font-medium">Your data is encrypted and secured via parent PIN.</p>
              </div>
            </div>
            <button 
              onClick={() => setIsPinModalOpen(true)}
              className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Update PIN
            </button>
          </section>
        </div>

        {/* --- Appearance Section --- */}
        <section className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/20 dark:border-gray-700 h-full">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                <Sun size={20} className="text-yellow-600" />
              </div>
              Appearance
            </h3>
            {savingTheme && <Loader2 size={16} className="animate-spin text-purple-500" />}
          </div>
          
          <div className="flex flex-col gap-4">
            {(['light', 'dark', 'auto'] as const).map((t) => {
              const active = theme === t;
              return (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t)}
                  className={`group relative flex items-center gap-4 p-5 rounded-[1.8rem] border transition-all duration-300 ${
                    active 
                      ? 'border-purple-500 bg-white dark:bg-gray-800 shadow-xl shadow-purple-500/10' 
                      : 'border-transparent bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800'
                  }`}
                >
                  <div className={`p-3 rounded-2xl transition-all ${
                    active ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>
                    {t === 'light' ? <Sun size={24} /> : t === 'dark' ? <Moon size={24} /> : <Monitor size={24} />}
                  </div>
                  <span className={`font-bold capitalize ${active ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>
                    {t} Mode
                  </span>
                  {active && (
                    <motion.div layoutId="parent-active-dot" className="ml-auto w-2 h-2 bg-purple-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20 p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600">
                  <KeyRound size={28} />
                </div>
                <button onClick={() => { setIsPinModalOpen(false); setNewPin(""); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400">
                  <X size={24} />
                </button>
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white mb-2">Update PIN</h2>
              <p className="text-gray-500 text-sm mb-8 font-medium">Secure your parent-only areas with a 4-digit code.</p>
              
              <div className="space-y-6">
                <input 
                  type="password" 
                  maxLength={4} 
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-transparent focus:border-purple-500 outline-none text-center text-3xl tracking-[0.8em] font-bold" 
                  placeholder="****" 
                />
                <button 
                  onClick={handleUpdatePin}
                  disabled={isSavingPin}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSavingPin ? <Loader2 className="animate-spin" size={24} /> : "Save New PIN"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}