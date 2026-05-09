import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Camera, 
  TrendingUp, 
  Eye,
  History,
  WifiOff
} from 'lucide-react';
import { useChild } from '../../contexts/ChildContext';
import { useSocket } from '../../contexts/SocketContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Interfaces ---
interface DistractionLog {
  id: string;
  timestamp: string;
  status: string;
  snapshot?: string;
}

interface StatCardProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  trend: string;
  color: 'blue' | 'orange' | 'emerald' | 'purple' | 'gray';
}

export default function Monitoring() {
  const { activeChild } = useChild();
  const { socket, lastActive } = useSocket(); // ✅ استدعاء lastActive لضمان الحقيقة
  
  const [isDistracted, setIsDistracted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Waiting for connection...");
  const [logs, setLogs] = useState<DistractionLog[]>([]);
  const [chartData] = useState<{time: string, focus: number}[]>([]);

  // ✅ حساب حالة الاتصال الفعلية لحظياً (لو استلمنا إشارة في آخر 15 ثانية)
  const childId = activeChild?.id?.toLowerCase() || "";
  const lastPulse = lastActive[childId] || 0;
  const isOnline = Date.now() - lastPulse < 15000; 

  // استقبال تنبيهات التشتت اللحظية
  useEffect(() => {
    if (!socket || !activeChild) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'distraction_alert' && data.data.child_id === activeChild.id) {
          setIsDistracted(true);
          setCurrentStatus(data.data.status);
          
          const newLog: DistractionLog = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            status: data.data.status,
            snapshot: data.data.snapshot
          };
          
          setLogs(prev => [newLog, ...prev]);
          
          const timer = setTimeout(() => {
            setIsDistracted(false);
            setCurrentStatus("Monitoring Active");
          }, 10000);
          
          return () => clearTimeout(timer);
        }
      } catch (err) {
        console.error("❌ Monitoring Socket Error:", err);
      }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, activeChild]);

  const formatTime = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).format(new Date(dateStr));
  };

  if (!activeChild) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <Eye className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase">No Child Selected</h2>
      <p className="text-gray-500 text-sm mt-2">Please select a child to start live monitoring.</p>
    </div>
  );

  return (
    // ✅ التعديل: تقليل الـ Padding لتبدأ الصفحة من الـ Top Left وتأخذ مساحة الشاشة
    <div className="p-4 lg:p-6 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            Live Monitoring
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            Tracking <span className="text-purple-600 font-bold">@{activeChild.name}</span> in real-time.
          </p>
        </div>

        {/* ✅ التعديل: الحالة لن تصبح FOCUSING إلا لو الكاميرا أرسلت إشارة فعلاً */}
        <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all duration-500 ${
          !isOnline 
            ? "bg-gray-100 border-gray-300 text-gray-400" 
            : isDistracted 
              ? "bg-red-50 border-red-500 text-red-600 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
              : "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            !isOnline ? 'bg-gray-400' : isDistracted ? 'bg-red-600' : 'bg-emerald-600'
          } ${isOnline ? 'animate-ping' : ''}`} />
          <span className="font-black text-sm uppercase tracking-widest">
            {!isOnline ? "STATUS: OFFLINE" : isDistracted ? `ALERT: ${currentStatus}` : "STATUS: FOCUSING"}
          </span>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={isOnline ? <Activity /> : <WifiOff />} 
          label="Live Connection" 
          value={isOnline ? "Stable" : "Lost"} 
          trend={isOnline ? "Connected" : "Disconnected"} 
          color={isOnline ? "blue" : "gray"}
        />
        <StatCard 
          icon={<AlertTriangle />} 
          label="Distractions" 
          value={logs.length.toString()} 
          trend="Today" 
          color="orange"
        />
        <StatCard 
          icon={<TrendingUp />} 
          label="Productivity" 
          value={isOnline ? "High" : "--"} 
          trend={isOnline ? "Analyzing" : "Offline"} 
          color={isOnline ? "emerald" : "gray"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- Focus Analytics Chart --- */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl text-purple-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Focus Performance</h3>
          </div>
          
          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip contentStyle={{borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  <Area type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorFocus)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase text-xs border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                No data available for today
              </div>
            )}
          </div>
        </div>

        {/* --- Distraction Logs --- */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600">
                <History className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Evidence Log</h3>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <div className="text-center py-10 opacity-40">
                <ShieldCheck className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-bold">No distractions detected today.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="group flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all border border-transparent hover:border-red-200">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    {log.snapshot ? (
                      <img src={log.snapshot} alt="Alert" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-black text-gray-800 dark:text-white mt-1 uppercase tracking-tighter">
                      {log.status}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color }: StatCardProps) {
  const colorMap = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-500',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-500',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-400'
  };

  const trendColorMap = {
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-500 bg-gray-50'
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-lg border border-gray-100 dark:border-gray-800 flex items-center gap-5">
      <div className={`p-4 rounded-2xl ${colorMap[color]}`}>
        {React.cloneElement(icon, { className: "w-7 h-7" })}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black dark:text-white">{value}</h4>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendColorMap[color]}`}>
            {trend}
          </span>
        </div>
      </div>
    </div>
  );
}