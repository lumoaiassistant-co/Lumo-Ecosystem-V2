import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus, Trash2, Edit2, Loader2, 
  ShieldCheck, Baby, GraduationCap, X, CheckCircle2, AlertCircle,
  Mail, Lock 
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { parentService } from '../../../services/parentService';
import { ChildProfile, CreateChildData } from '../../../types/parent';
import { useChild } from '../../../contexts/ChildContext';

// تعريف نوع البيانات اللي راجعة من الـ API لضمان التوافق مع _id
interface ChildApiResponse extends ChildProfile {
  _id?: string;
}

export default function ManageKids() {
  const { setActiveChild, activeChild } = useChild();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateChildData & { email?: string, password?: string }>({
    name: '',
    age: 5,
    grade: 'Grade 1',
    avatar: 'boy-1',
    email: '',
    password: ''
  });

  const loadChildren = useCallback(async () => {
    try {
      setLoading(true);
      const data = await parentService.getChildren();
      // ✅ تم تغيير any إلى ChildApiResponse
      const mappedChildren = data.map((c: ChildApiResponse) => {
        const childId = c.id || c._id || '';
        return { ...c, id: childId, is_active: childId === activeChild?.id };
      });
      setChildren(mappedChildren);
    } catch {
      console.error("Failed to load children");
    } finally {
      setLoading(false);
    }
  }, [activeChild?.id]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', age: 5, grade: 'Grade 1', avatar: 'boy-1', email: '', password: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (child: ChildProfile) => {
    setModalMode('edit');
    setEditingId(child.id);
    setFormData({
      name: child.name,
      age: child.age,
      grade: child.grade,
      avatar: child.avatar,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      if (modalMode === 'add') {
        // ✅ شلنا newChild اللي مكانتش مستخدمة
        await parentService.addChild(formData);
        await loadChildren(); 
      } else if (editingId) {
        await parentService.updateChild(editingId, formData);
        setChildren(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } : c));
        if (activeChild?.id === editingId) {
          setActiveChild({ ...activeChild, ...formData });
        }
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      // ✅ التعامل مع الـ unknown error بدل any
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    setFormLoading(true);
    setFormError(null);
    try {
      const success = await parentService.deleteChild(deleteConfirm.id);
      if (success) {
        setChildren(prev => prev.filter(c => c.id !== deleteConfirm.id));
        if (activeChild?.id === deleteConfirm.id) setActiveChild(null);
        setDeleteConfirm({ isOpen: false, id: null });
      } else {
        setFormError("Delete failed on server.");
      }
    } catch {
      // ✅ شلنا الـ err: any اللي مش مستخدمة
      setFormError("Could not delete profile. Try again.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-white">Manage Kids 🧒</h1>
          <p className="text-gray-500 mt-1">Add and manage your children's learning profiles</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-gradient-purple-pink text-white flex items-center gap-2 px-8 py-4 rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all font-bold"
        >
          <UserPlus className="w-5 h-5" /> Add Child
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        <AnimatePresence mode="popLayout">
          {children.map((child) => (
            <motion.div
              key={child.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] relative group border-2 transition-all duration-300 shadow-lg ${
                activeChild?.id === child.id ? 'border-purple-500 bg-purple-50/10' : 'border-transparent'
              }`}
            >
              <button 
                onClick={() => setActiveChild({ ...child, is_active: true })}
                className="absolute top-6 left-6"
              >
                {activeChild?.id === child.id ? (
                  <CheckCircle2 className="w-7 h-7 text-purple-600" />
                ) : (
                  <div className="w-7 h-7 rounded-full border-2 border-gray-100 group-hover:border-purple-300 transition-colors" />
                )}
              </button>

              <div className="flex flex-col items-center text-center mt-4">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-inner border border-white dark:border-gray-600">
                  {child.avatar.includes('boy') ? '👦' : '👧'}
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-white">{child.name}</h3>
                <div className="flex gap-2 mt-2">
                  <span className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-[10px] font-black text-gray-500 uppercase">
                    {child.grade}
                  </span>
                  <span className="px-4 py-1.5 bg-purple-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-500/20">
                    Level {child.level || 1}
                  </span>
                </div>
              </div>

              <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button 
                  onClick={() => openEditModal(child)}
                  className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setDeleteConfirm({ isOpen: true, id: child.id })}
                  className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-3xl font-display font-bold text-gray-800 dark:text-white">
                    {modalMode === 'add' ? 'New Explorer 🚀' : 'Update Profile ✏️'}
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-colors text-gray-400">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {formError}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Baby className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        required className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-700 focus:border-purple-400 outline-none transition-all dark:bg-gray-900 font-bold"
                        placeholder="Child's Name"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    
                    {modalMode === 'add' && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                          <input 
                            type="email" required
                            className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 border-purple-50 dark:border-gray-700 focus:border-purple-400 outline-none transition-all dark:bg-gray-900 font-bold"
                            placeholder="Child's Login Email"
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
                          <input 
                            type="password" required
                            className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 border-purple-50 dark:border-gray-700 focus:border-purple-400 outline-none transition-all dark:bg-gray-900 font-bold"
                            placeholder="Set Password"
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 gap-5">
                      <div className="relative">
                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="number" required min="3" max="18"
                          className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-700 focus:border-purple-400 outline-none dark:bg-gray-900 font-bold"
                          placeholder="Age"
                          value={formData.age}
                          onChange={e => setFormData({...formData, age: parseInt(e.target.value)})}
                        />
                      </div>

                      <div className="relative">
                        <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select 
                          className="w-full pl-14 pr-6 py-5 rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-700 focus:border-purple-400 outline-none appearance-none dark:bg-gray-900 font-bold cursor-pointer"
                          value={formData.grade}
                          onChange={e => setFormData({...formData, grade: e.target.value})}
                        >
                          {['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 py-4">
                    {['boy-1', 'girl-1'].map(avatar => (
                      <button
                        key={avatar} type="button"
                        onClick={() => setFormData({...formData, avatar})}
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl transition-all border-4 ${
                          formData.avatar === avatar ? 'border-purple-500 bg-purple-50 scale-110 shadow-lg' : 'border-transparent bg-gray-50 opacity-40'
                        }`}
                      >
                        {avatar === 'boy-1' ? '👦' : '👧'}
                      </button>
                    ))}
                  </div>

                  <button 
                    disabled={formLoading}
                    className="w-full bg-gradient-purple-pink text-white py-5 rounded-[1.8rem] font-black text-lg shadow-2xl flex justify-center items-center gap-3"
                  >
                    {formLoading ? <Loader2 className="animate-spin" /> : modalMode === 'add' ? "Create Explorer & Account" : "Save Changes"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm.isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl border border-white/10"
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-800 dark:text-white mb-2">Delete Profile?</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium px-4 font-body">This action is permanent and will erase all learning progress.</p>
              
              {formError && (
                <div className="mb-4 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl border border-red-100">
                  {formError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmDelete}
                  disabled={formLoading}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all flex justify-center items-center gap-2"
                >
                  {formLoading ? <Loader2 className="animate-spin" /> : "Confirm Delete"}
                </button>
                <button 
                  onClick={() => {
                    setDeleteConfirm({ isOpen: false, id: null });
                    setFormError(null);
                  }}
                  className="w-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}