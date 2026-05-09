import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  BrainCircuit, 
  FileQuestion, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageSquare 
} from 'lucide-react';
import { FloatingBackground } from './SharedElements';
import { useSocket } from '../../contexts/SocketContext';
import { chatService } from '../../services/chatService'; 

interface ChildLayoutProps {
  children: ReactNode;
}

const CHILD_NAV = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/study', icon: GraduationCap, label: 'Study Zone' },
  { path: '/tutor', icon: BrainCircuit, label: 'AI Tutor' },
  { path: '/quizzes', icon: FileQuestion, label: 'Quizzes' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function ChildLayout({ children }: ChildLayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ جلب عداد الرسايل من السوكيت
  const { unreadCount, setUnreadCount } = useSocket();

  // ✅ تحديد إذا كنا في صفحة الشات لإلغاء الـ Padding وتغيير السلوك لـ Full Screen
  const isChatPage = location.pathname === '/chat';

  // ✅ مزامنة العداد مع الداتابيز أول ما الطفل يدخل التطبيق
  useEffect(() => {
    const syncUnread = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const counts = await chatService.getUnreadCounts(token);
          const totalUnread = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
          setUnreadCount(totalUnread);
        } catch (err) {
          console.error("❌ Failed to sync initial unread counts for child", err);
        }
      }
    };
    syncUnread();
  }, [setUnreadCount]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.clear(); 
    window.location.href = '/login'; 
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-start">
      <FloatingBackground />

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-purple-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed lg:relative z-40 w-72 h-screen glass border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col bg-white/80 dark:bg-gray-900/90 backdrop-blur-md flex-shrink-0"
          >
            {/* Branding */}
            <div className="flex items-center gap-3 mb-12 px-2">
              <div className="w-12 h-12 bg-gradient-purple-pink rounded-2xl flex items-center justify-center text-2xl shadow-lg text-white">
                🤖
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-purple-pink bg-clip-text text-transparent">
                  Lumo
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">Child Edition</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-2">
              {CHILD_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isChat = item.label === 'Chat';

                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (isChat) setUnreadCount(0);
                    }}
                  >
                    <motion.div
                      whileHover={{ x: 5 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${
                        active 
                          ? 'bg-gradient-purple-pink text-white shadow-purple-500/20 shadow-lg' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>

                      {isChat && unreadCount > 0 && !active && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute right-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-gray-900"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <button 
              onClick={handleLogout} 
              className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold group"
            >
              <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              <span className="font-medium">Logout</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      {/* ✅ التعديل الجوهري: لو إحنا في صفحة الشات بنشيل الـ Padding ونلغي الـ Scroll الخارجي عشان الشات يفرش صح */}
      <main className={`flex-1 h-screen relative z-10 flex flex-col ${isChatPage ? 'overflow-hidden' : 'overflow-y-auto p-4 md:p-10 items-start justify-start'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full ${isChatPage ? 'h-full' : 'text-left'}`}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}