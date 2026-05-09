import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, Sun, Monitor, User, Trash2, 
  Plus, Loader2, AlertCircle, X 
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { settingsService } from '../services/settingsService';
import { ChildProfile } from '../types/parent';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const userRole = localStorage.getItem('role');
  const hasFetchedInitial = useRef(false);

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [focusSensitivity, setFocusSensitivity] = useState(70);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildGrade, setNewChildGrade] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettings();
      
      // ✅ سحب الثيم مرة واحدة فقط عند البداية لمنع الـ Auto-reset
      if (!hasFetchedInitial.current) {
        setTheme(settings.theme);
        hasFetchedInitial.current = true;
      }
      
      setFocusSensitivity(settings.focus_sensitivity);

      if (userRole === 'parent') {
        const childList = await settingsService.getChildren();
        setChildren(childList as ChildProfile[]);
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, setTheme]);

  useEffect(() => { loadData(); }, [loadData]);

  // ✅ تفعيل الحفظ التلقائي في الداتابيز عند تغيير الثيم
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
    try {
      // نستخدم PATCH لتحديث الثيم فقط في الداتابيز
      await settingsService.updateSettings({ theme: newTheme });
    } catch {
      console.error("Failed to save theme preference");
    }
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await settingsService.addChild(newChildName, newChildGrade);
      if (result) {
        setChildren(prev => [...prev, result as ChildProfile]);
        setIsAddModalOpen(false);
        setNewChildName("");
        setNewChildGrade("");
      }
    } catch {
      alert("Failed to add child");
    }
  };

  if (loading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-purple-600 w-12 h-12" />
    </div>
  );

  return (
    // ✅ ضبط الـ Layout ليبدأ توب ليفت ويملأ الشاشة
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="w-full space-y-8 pb-20 pt-0"
    >
      <header className="mb-10">
        <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-white flex items-center gap-3">
          Settings <span className="text-2xl">⚙️</span>
        </h1>
        <p className="text-gray-500 font-medium">Manage your preferences and profiles</p>
      </header>

      {/* --- 1. Theme Selection --- */}
      <section className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-8 shadow-xl rounded-[2.5rem] border border-white/20 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-gray-800 dark:text-white">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
            <Sun size={22} className="text-yellow-600" />
          </div>
          Look & Feel
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['light', 'dark', 'auto'] as const).map((t) => (
            <button
              key={t} 
              onClick={() => handleThemeChange(t)}
              className={`group p-8 rounded-[2.5rem] border transition-all duration-300 flex flex-col items-center gap-4 relative overflow-hidden ${
                theme === t 
                ? 'border-purple-500 bg-white dark:bg-gray-800 shadow-2xl shadow-purple-500/10' 
                : 'border-transparent bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-all duration-300 ${
                theme === t ? 'bg-purple-500 text-white scale-110' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 group-hover:scale-110'
              }`}>
                {t === 'light' ? <Sun size={28} /> : t === 'dark' ? <Moon size={28} /> : <Monitor size={28} />}
              </div>
              <span className={`font-bold text-lg capitalize ${theme === t ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
                {t} Mode
              </span>
              {theme === t && (
                <motion.div 
                  layoutId="active-indicator" 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"
                />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* --- 2. Parent Section (إدارة ملفات الأطفال) --- */}
      {userRole === 'parent' && (
         <section className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-8 shadow-xl rounded-[2.5rem] border border-white/20 dark:border-gray-700 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800 dark:text-white">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <User size={22} className="text-blue-600" />
                </div>
                Family Profiles
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                <Plus size={20} /> Add Child
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {children.length === 0 ? (
                <p className="text-center text-gray-400 py-10 col-span-full">No children profiles found.</p>
              ) : (
                children.map(child => (
                  <div key={child.id} className="flex items-center justify-between p-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 group">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                        {child.avatar === 'student' ? '👧' : '👦'}
                      </div>
                      <div>
                        <span className="font-bold text-lg block text-gray-800 dark:text-white">{child.name}</span>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] font-black uppercase">
                          {child.grade}
                        </span>
                      </div>
                    </div>
                    <button className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
         </section>
      )}

      {/* --- 3. Child Only: Vision Sensitivity --- */}
      {userRole === 'child' && (
        <section className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-8 shadow-xl rounded-[2.5rem] border border-white/20 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-gray-800 dark:text-white">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <AlertCircle size={22} className="text-purple-600" />
            </div>
            Vision Sensitivity
          </h3>
          <p className="text-gray-500 mb-10 font-medium">How strict should Lumo be when monitoring your focus?</p>
          
          <div className="w-full">
            <input 
              type="range" min="0" max="100" value={focusSensitivity}
              onChange={(e) => setFocusSensitivity(Number(e.target.value))}
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-purple-600" 
            />
            <div className="flex justify-between mt-6 text-xs font-black text-gray-400 uppercase tracking-widest">
              <span>Relaxed</span>
              <span className="text-2xl font-display text-purple-600">{focusSensitivity}%</span>
              <span>Strict</span>
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className="bg-white dark:bg-gray-800 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative border border-white/20"
            >
              <button onClick={() => setIsAddModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600"><X /></button>
              <h3 className="text-3xl font-display font-bold mb-8 text-gray-800 dark:text-white">New Explorer 🚀</h3>
              <form onSubmit={handleAddChild} className="space-y-6">
                <input required placeholder="Full Name" className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 outline-none focus:border-purple-500 transition-all font-bold text-gray-800 dark:text-white" value={newChildName} onChange={e => setNewChildName(e.target.value)} />
                <input required placeholder="Grade / Level" className="w-full p-5 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 outline-none focus:border-purple-500 transition-all font-bold text-gray-800 dark:text-white" value={newChildGrade} onChange={e => setNewChildGrade(e.target.value)} />
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                  Create Profile
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}