import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Code, FlaskConical, Globe, Calculator, FileText, Upload, X, Loader2, PartyPopper, Trash2, ImagePlus, AlertCircle } from 'lucide-react'; 
import { useState, useEffect, useCallback, useRef } from 'react';
import { studyService, Book } from '../../services/studyService';

const FloatingShape = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: number; color: string }) => (
  <motion.div
    className={`absolute rounded-full ${color} opacity-10 blur-[80px] pointer-events-none`}
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
    transition={{ delay, repeat: Infinity, duration: 8 + delay, ease: "easeInOut" }}
  />
);

const CATEGORIES = [
  { id: 'all', label: 'All Materials', icon: BookOpen, color: 'text-gray-400' },
  { id: 'math', label: 'Math', icon: Calculator, color: 'text-purple-400' },
  { id: 'science', label: 'Science', icon: FlaskConical, color: 'text-blue-400' },
  { id: 'coding', label: 'Coding', icon: Code, color: 'text-pink-400' },
  { id: 'history', label: 'History', icon: Globe, color: 'text-yellow-400' },
];

export default function ParentLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);

  // States
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // New Upload Fields
  const [tempFile, setTempFile] = useState<File | null>(null);
  const [tempCover, setTempCover] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({ 
    title: '', 
    category: 'math',
    pages_count: 0,
    difficulty: 'Easy' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studyService.getBooks(searchQuery, selectedCategory);
      setBooks(data || []);
    } catch (err: unknown) { 
       console.error("Failed to load library:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => { loadBooks(); }, 500);
    return () => clearTimeout(timer);
  }, [loadBooks]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile(file);
      setUploadData({ ...uploadData, title: file.name.split('.')[0] });
      setShowUploadModal(true);
    }
  };

  const handleFinalUpload = async () => {
    if (!tempFile) return;
    setIsUploading(true);
    try {
      // ✅ لاحظ إرسال الحقول الجديدة للـ service
      await studyService.uploadBook(
        tempFile, 
        uploadData.title, 
        uploadData.category,
        uploadData.pages_count,
        uploadData.difficulty,
        tempCover || undefined
      );
      setShowUploadModal(false);
      setTempFile(null);
      setTempCover(null);
      await loadBooks();
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 4000);
    } catch {
      alert("Upload failed. Try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await studyService.deleteBook(deleteConfirmId);
      setBooks(books.filter(b => b.id !== deleteConfirmId));
      setDeleteConfirmId(null);
    } catch {
      alert("Delete failed.");
    }
  };

  return (
    <div className="w-full flex flex-col items-start justify-start space-y-4 pb-10 relative min-h-full pt-0 mt-[-12px] ml-[-4px]">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <FloatingShape delay={0} x="5%" y="10%" size={200} color="bg-pink-600/10" />
        <FloatingShape delay={2} x="85%" y="20%" size={250} color="bg-purple-600/10" />
      </div>

      {/* Success Toast */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 20 }} exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-gradient-purple-pink text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 font-bold border border-white/20"
          >
            <PartyPopper className="w-6 h-6 animate-bounce" />
            <span>Success! Library updated! 🚀</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gray-900 dark:text-white uppercase tracking-tight">Library Manager 🛠️</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-xs md:text-sm">Manage your child's educational materials</p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          <div className="relative flex-1 sm:w-80 group">
            <input type="text" placeholder="Search resources..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-purple-500/50 transition-all text-sm shadow-xl"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
          </div>

          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-purple-pink text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap"
          >
            <Upload size={18} />
            <span>Upload New Book</span>
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileSelect} />
        </div>
      </header>

      {/* Categories */}
      <div className="w-full flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold transition-all border-2 text-xs whitespace-nowrap ${
                active 
                ? 'bg-gradient-purple-pink text-white border-transparent shadow-lg scale-105' 
                : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-purple-500/30'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : cat.color}`} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="w-full pt-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {[1, 2, 3, 4, 5].map((n) => <div key={n} className="h-64 bg-gray-200 dark:bg-gray-800/50 rounded-[2rem] animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            <AnimatePresence mode="popLayout">
              {books.map((book) => (
                <motion.div key={book.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative bg-white dark:bg-gray-800/30 border border-gray-200 dark:border-white/5 rounded-[1.8rem] p-3.5 hover:shadow-2xl dark:hover:bg-gray-800/50 transition-all overflow-hidden"
                >
                  <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden">
                    {book.thumbnail ? <img src={book.thumbnail} alt="" className="w-full h-full object-cover" /> : <FileText size={40} className="text-purple-500/20" />}
                    
                    {/* Delete Trigger */}
                    <button onClick={() => setDeleteConfirmId(book.id)} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-white line-clamp-1 px-1">{book.title}</h3>
                  <div className="flex justify-between items-center mt-1 px-1">
                    <p className="text-[9px] text-purple-500 font-bold uppercase tracking-widest">{book.category}</p>
                    <span className="text-[8px] text-gray-400 font-medium">Difficulty: {book.difficulty || 'Easy'}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && books.length === 0 && (
        <div className="w-full text-center py-20 bg-white dark:bg-gray-800/20 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/5">
          <BookOpen size={48} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-tighter">Library is Empty</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs">Start by uploading educational PDFs for your child.</p>
        </div>
      )}

      {/* ✅ Custom Confirm Delete Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This action cannot be undone. The book will be permanently removed.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition-all">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ Enhanced Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 p-8 rounded-[2.5rem] max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">New Resource 📚</h3>
                <button onClick={() => setShowUploadModal(false)}><X className="text-gray-500 hover:text-red-500" /></button>
              </div>
              
              <div className="space-y-4">
                {/* Book Title */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Title</label>
                  <input type="text" value={uploadData.title} onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-purple-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Pages Count */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Total Pages</label>
                    <input type="number" value={uploadData.pages_count} onChange={(e) => setUploadData({...uploadData, pages_count: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-gray-900 dark:text-white outline-none focus:border-purple-500" />
                  </div>
                  {/* Difficulty */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Difficulty</label>
                    <select value={uploadData.difficulty} onChange={(e) => setUploadData({...uploadData, difficulty: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-gray-900 dark:text-white outline-none">
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Category</label>
                  <select value={uploadData.category} onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 p-4 rounded-xl text-gray-900 dark:text-white outline-none cursor-pointer">
                    <option value="math">Math</option>
                    <option value="science">Science</option>
                    <option value="coding">Coding</option>
                    <option value="history">History</option>
                  </select>
                </div>

                {/* Cover Image Upload */}
                <div className="relative">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Cover Image (Optional)</label>
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="mt-1 w-full h-32 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-all overflow-hidden"
                  >
                    {tempCover ? (
                      <img src={URL.createObjectURL(tempCover)} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <>
                        <ImagePlus className="text-gray-400 mb-2" />
                        <span className="text-xs text-gray-400">Click to upload cover</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => setTempCover(e.target.files?.[0] || null)} />
                </div>

                <button onClick={handleFinalUpload} disabled={isUploading}
                  className="w-full bg-gradient-purple-pink text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="animate-spin" /> : "Confirm & Save Resource"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}