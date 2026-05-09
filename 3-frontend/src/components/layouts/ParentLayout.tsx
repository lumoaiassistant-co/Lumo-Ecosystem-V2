import { ReactNode, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom'; 
import { 
  Users, 
  PenTool, 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  MessageSquare,
  Eye,
  BookOpen // ✅ أضفنا أيقونة المكتبة
} from 'lucide-react';
import { FloatingBackground } from './SharedElements';
import { useChild } from '../../contexts/ChildContext';
import { useSocket } from '../../contexts/SocketContext';
import { chatService } from '../../services/chatService'; 

interface ParentLayoutProps {
  children: ReactNode;
}

const PARENT_NAV = [
  { path: '/parent/dashboard', icon: BarChart3, label: 'Analytics' },
  { path: '/parent/monitoring', icon: Eye, label: 'Live Monitoring' },
  { path: '/parent/quiz-maker', icon: PenTool, label: 'Quiz Maker' },
  { path: '/parent/library', icon: BookOpen, label: 'Library' }, // ✅ تم إضافة المسار الجديد هنا
  { path: '/parent/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/parent/kids', icon: Users, label: 'Manage Kids' },
  { path: '/parent/settings', icon: Settings, label: 'Account Settings' },
];

export default function ParentLayout({ children }: ParentLayoutProps) {
  const location = useLocation();
  const { activeChild } = useChild();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { unreadCount, setUnreadCount } = useSocket();

  // ✅ تحديد الصفحات اللي محتاجة مساحة كاملة بدون Padding (الشات والمراقبة)
  const isChatPage = location.pathname === '/parent/chat';
  const isMonitoringPage = location.pathname === '/parent/monitoring';

  useEffect(() => {
    const syncUnreadCounts = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const counts = await chatService.getUnreadCounts(token);
          const totalUnread = Object.values(counts).reduce((acc, curr) => acc + curr, 0);
          setUnreadCount(totalUnread);
        } catch (err) {
          console.error("❌ Failed to sync initial unread counts", err);
        }
      }
    };
    syncUnreadCounts();
  }, [setUnreadCount]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear(); 
    window.location.href = '/login'; 
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-gray-900 flex">
      <FloatingBackground />

      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6 text-purple-600" /> : <Menu className="w-6 h-6 text-gray-600" />}
        </button>
      </div>

      <AnimatePresence>
        {(isMobileMenuOpen || window.innerWidth >= 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed lg:relative z-40 w-72 h-screen glass border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col bg-white/80 dark:bg-gray-900/90 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-8 px-2">
              <div className="w-12 h-12 bg-gradient-purple-pink rounded-2xl flex items-center justify-center text-2xl shadow-lg text-white">🛡️</div>
              <div>
                <h1 className="text-2xl font-display font-bold bg-gradient-purple-pink bg-clip-text text-transparent">Lumo</h1>
                <p className="text-[10px] uppercase tracking-wider text-purple-500 font-bold">Parent Control</p>
              </div>
            </div>

            {activeChild && (
              <div className="mb-8 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/50">
                <p className="text-[10px] text-purple-400 font-bold uppercase mb-2">Monitoring Profile</p>
                <div className="flex items-center gap-3">
                   <div className="text-xl">{activeChild.avatar === 'student' ? '👧' : '👦'}</div>
                   <span className="font-bold text-gray-700 dark:text-gray-200">{activeChild.name}</span>
                </div>
              </div>
            )}

            <nav className="flex-1 space-y-2">
              {PARENT_NAV.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                const isChat = item.label === 'Chat';
                return (
                  <Link key={item.path} to={item.path} onClick={() => { setIsMobileMenuOpen(false); if (isChat) setUnreadCount(0); }}>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all relative ${active ? 'bg-gradient-purple-pink text-white shadow-lg shadow-purple-500/20' : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-gray-800'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {isChat && unreadCount > 0 && !active && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute right-4 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-white dark:border-gray-900">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Logout</span>
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* --- Main Content Area --- */}
      <main className={`flex-1 h-screen relative z-10 flex flex-col ${
        isChatPage ? 'overflow-hidden' : 'overflow-y-auto'
      } ${ (isChatPage || isMonitoringPage) ? 'p-0' : 'p-4 md:p-8'}`}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full ${isChatPage || isMonitoringPage ? 'h-full' : ''}`}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}