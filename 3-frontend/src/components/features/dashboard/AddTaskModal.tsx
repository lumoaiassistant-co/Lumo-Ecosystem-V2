import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Clock, BookOpen, Layout, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { dashboardService } from '../../../services/dashboardService';
import { Task } from '../../../types/dashboard';

// نقل الثوابت خارج المكون لتجنب إعادة التعريف
const TASK_COLORS = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Green', value: 'bg-green-100 text-green-700 border-green-200' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { name: 'Red', value: 'bg-red-100 text-red-700 border-red-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-700 border-purple-200' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const INITIAL_FORM_STATE: Partial<Task> = {
  title: '',
  subject: '',
  duration: '30 min',
  day: 'Monday',
  color: 'bg-blue-100 text-blue-700 border-blue-200',
};

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeChildId?: string;
  activeChildName?: string;
}

export default function AddTaskModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  activeChildId, 
  activeChildName 
}: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>(INITIAL_FORM_STATE);

  useEffect(() => {
    if (isOpen) setNewTask(INITIAL_FORM_STATE);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // ✅ الحل هنا: تعريف الـ payload صراحة كـ Partial<Task> عشان TypeScript يسكت
      const payload: Partial<Task> = {
        ...newTask,
        created_by: activeChildId ? 'parent' : 'child'
      };

      const success = await dashboardService.createTask(payload, activeChildId);
      
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error("Error creating task:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Plus className="text-purple-500" /> New Mission
                  </h3>
                  {activeChildName && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <ShieldCheck size={14} className="text-blue-500" /> Assigning to <b>{activeChildName}</b>
                    </p>
                  )}
                </div>
                <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Layout className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text" required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-purple-500 outline-none transition-all dark:text-white"
                      placeholder="Mission Title"
                      value={newTask.title}
                      onChange={e => setNewTask({...newTask, title: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text" required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-purple-500 outline-none transition-all dark:text-white"
                        placeholder="Subject"
                        value={newTask.subject}
                        onChange={e => setNewTask({...newTask, subject: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-purple-500 outline-none appearance-none cursor-pointer dark:text-white"
                        value={newTask.duration}
                        onChange={e => setNewTask({...newTask, duration: e.target.value})}
                      >
                        <option value="15 min">15 min</option>
                        <option value="30 min">30 min</option>
                        <option value="1 hour">1 hour</option>
                        <option value="2 hours">2 hours</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Day</label>
                      <select
                        className="w-full p-4 rounded-2xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-purple-500 outline-none dark:text-white"
                        value={newTask.day}
                        onChange={e => setNewTask({...newTask, day: e.target.value})}
                      >
                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Color</label>
                      <div className="flex gap-2 p-2 justify-around">
                        {TASK_COLORS.map((c) => (
                          <button
                            key={c.name} type="button"
                            onClick={() => setNewTask({...newTask, color: c.value})}
                            className={`w-8 h-8 rounded-full border-4 transition-all ${
                              newTask.color === c.value ? 'border-purple-500 scale-110 shadow-lg' : 'border-transparent'
                            }`}
                            style={{ 
                              backgroundColor: c.value.includes('blue') ? '#DBEAFE' : 
                                               c.value.includes('green') ? '#DCFCE7' : 
                                               c.value.includes('yellow') ? '#FEF9C3' : 
                                               c.value.includes('red') ? '#FEE2E2' : '#F3E8FF' 
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-xl py-5 rounded-3xl shadow-xl shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Deploying...' : 'Assign Mission 🚀'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}