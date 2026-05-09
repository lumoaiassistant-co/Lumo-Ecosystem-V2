import { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, ArrowUpRight, Eye, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChild } from '../../../contexts/ChildContext';
import { useSocket } from '../../../contexts/SocketContext';

export default function VisionStatsCard() {
  const { activeChild } = useChild();
  const { socket, lastActive } = useSocket(); // ✅ استدعاء lastActive من السوكيت
  
  const [isDistracted, setIsDistracted] = useState(false);
  const [statusText, setStatusText] = useState("Waiting for signal...");

  // ✅ تحديد حالة الاتصال الحقيقية (لو استلمنا إشارة في آخر 15 ثانية)
  const childId = activeChild?.id?.toLowerCase() || "";
  const lastPulse = lastActive[childId] || 0;
  const isOnline = Date.now() - lastPulse < 15000; 

  useEffect(() => {
    if (!socket || !activeChild) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // معالجة تنبيه التشتت فقط (الاتصال أصبح يُحسب تلقائياً من lastActive)
        if (data.type === 'distraction_alert' && data.data.child_id === activeChild.id) {
          setIsDistracted(true);
          setStatusText(data.data.status || "Distraction Detected");

          const timer = setTimeout(() => {
            setIsDistracted(false);
            setStatusText("Monitoring Active");
          }, 10000);

          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("❌ Socket Error in VisionCard:", err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, activeChild]);

  if (!activeChild) return null;

  const getCardStyles = () => {
    if (!isOnline) return "bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700 opacity-70";
    if (isDistracted) return "bg-red-50 border-red-500/30 dark:bg-red-900/10 dark:border-red-500/20";
    return "bg-white border-emerald-100 dark:bg-gray-900 dark:border-emerald-900/30";
  };

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 transition-all duration-500 shadow-xl relative overflow-hidden group ${getCardStyles()}`}>
      
      <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-20 rounded-full transition-colors ${
        !isOnline ? 'bg-gray-400' : isDistracted ? 'bg-red-600' : 'bg-emerald-600'
      }`} />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className={`p-3 rounded-2xl transition-colors ${
          !isOnline ? 'bg-gray-200 text-gray-500' : isDistracted ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {!isOnline ? <WifiOff className="w-6 h-6" /> : isDistracted ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
        </div>
        
        {/* ✅ السهم دلوقتى z-20 وفوق كل الطبقات عشان يشتغل */}
        <Link 
          to="/parent/monitoring" 
          className="p-3 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all text-gray-400 hover:text-purple-600 relative z-20 shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
        >
          <ArrowUpRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="space-y-1 relative z-10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          Focus Guard Status
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            !isOnline ? 'bg-gray-400' : isDistracted ? 'bg-red-600 animate-ping' : 'bg-emerald-600'
          }`} />
          <p className={`text-2xl font-black uppercase tracking-tighter ${
            !isOnline ? 'text-gray-400' : isDistracted ? 'text-red-600' : 'text-gray-900 dark:text-white'
          }`}>
            {!isOnline ? "Offline" : isDistracted ? "Distracted" : "Focused"}
          </p>
        </div>
        <p className="text-xs font-bold text-gray-500/80 truncate">
          {!isOnline ? "No active camera session..." : isDistracted ? `Reason: ${statusText}` : "Live tracking is active"}
        </p>
      </div>

      <div className={`grid transition-all duration-500 ${isOnline ? 'grid-rows-[1fr] mt-6 opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <Link 
            to="/parent/monitoring"
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-[10px] font-black uppercase transition-all shadow-lg active:scale-95 ${
              isDistracted ? 'bg-red-600 text-white shadow-red-500/30 hover:bg-red-700' : 'bg-purple-600 text-white shadow-purple-500/30 hover:bg-purple-700'
            }`}
          >
            <Eye className="w-4 h-4" />
            {isDistracted ? "Check Evidence" : "Open Live View"}
          </Link>
        </div>
      </div>
    </div>
  );
}