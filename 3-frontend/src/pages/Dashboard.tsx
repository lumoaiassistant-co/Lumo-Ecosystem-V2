import { motion } from 'framer-motion';
import { 
  Bell, Calendar, CheckCircle2, TrendingUp, Loader2, 
  BookOpen, Smartphone, Zap, Award, ShieldCheck 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, 
  Radar 
} from 'recharts';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WeeklyPlanner from '../components/WeeklyPlanner';
import { useChild } from '../contexts/ChildContext';
import { dashboardService } from '../services/dashboardService';
import { StatCard } from '../components/features/dashboard/StatCard';
import { UserProfile, DashboardStats, Task, RawTask } from '../types/dashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeChild } = useChild();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [userData, statsData, tasksData] = await Promise.all([
        dashboardService.getUserMe(),
        dashboardService.getStats(activeChild?.id),
        dashboardService.getTasks(activeChild?.id)
      ]);

      setUser(userData);
      setStats(statsData);
      setAllTasks(tasksData.map((t: RawTask) => ({ 
        ...t, 
        id: t.id || t._id || 'unknown'
      } as Task)));
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [activeChild, navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));
    await dashboardService.updateTask(taskId, !currentStatus);
    
    const newStats = await dashboardService.getStats(activeChild?.id);
    setStats(newStats);
  };

  const dashboardData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];
    const todayTasks = allTasks.filter(t => t.day === currentDay);
    const completedCount = todayTasks.filter(t => t.is_completed).length;
    const progressPercent = todayTasks.length ? Math.round((completedCount / todayTasks.length) * 100) : 0;
    
    const avgFocus = stats?.focus_data?.length 
      ? Math.round(stats.focus_data.reduce((a, b) => a + b.focus, 0) / stats.focus_data.length) 
      : 0;

    const xpProgress = stats?.current_xp && stats?.xp_to_next_level 
      ? (stats.current_xp / stats.xp_to_next_level) * 100 
      : 0;

    return { todayTasks, progressPercent, avgFocus, xpProgress };
  }, [allTasks, stats]);

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* Hero Header */}
      <header className="relative p-8 rounded-[2.5rem] bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 text-white shadow-2xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
               <span className="px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
                 Level {stats?.current_level || 1} Explorer
               </span>
               <div className="flex items-center gap-1 text-yellow-300 font-bold text-sm">
                  <Award className="w-4 h-4" /> {stats?.current_xp || 0} XP
               </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold">
              Hey, {user?.firstName}! 👋
            </h1>
            <p className="mt-2 text-purple-100 font-medium text-lg">
              {dashboardData.progressPercent === 100 
                ? "Outstanding! You've crushed every mission today! 🏆" 
                : `Keep the momentum! You've finished ${dashboardData.progressPercent}% of your goals.`}
            </p>
          </div>

          <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-xs font-black uppercase tracking-tighter">
               <span>Next Level: { (stats?.current_level || 1) + 1 }</span>
               <span>{Math.round(dashboardData.xpProgress)}%</span>
            </div>
            <div className="h-4 bg-black/20 rounded-full p-1 overflow-hidden border border-white/10">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${dashboardData.xpProgress}%` }}
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(253,224,71,0.5)]"
               />
            </div>
          </div>
        </div>
        
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <Zap className="absolute right-10 top-10 w-24 h-24 opacity-10 rotate-12" />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Average Focus" 
          value={`${dashboardData.avgFocus}%`} 
          icon={<TrendingUp className="w-8 h-8 text-purple-500" />} 
          progress={dashboardData.avgFocus}
        />
        <StatCard 
          title="Today's Quests" 
          value={`${dashboardData.todayTasks.filter(t => t.is_completed).length}/${dashboardData.todayTasks.length}`} 
          icon={<CheckCircle2 className="w-8 h-8 text-green-500" />} 
          progress={dashboardData.progressPercent}
        />
        <StatCard 
          title="Active Profile" 
          value={activeChild?.name || "Lumo Student"} 
          icon="👧"
          isCustom
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Notifications Section */}
        <section className="card p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-none shadow-xl">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
            <Bell className="w-6 h-6 text-purple-500" /> Activity Stream
          </h2>
          <div className="space-y-4">
            {stats?.notifications?.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No new alerts. You're doing great!</p>
            ) : (
              stats?.notifications?.map((notif) => (
                <div key={notif.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 group hover:border-purple-200 transition-all">
                  <div className={`p-3 rounded-xl ${notif.type === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {notif.type === 'warning' ? <Smartphone className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-widest">{notif.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Daily Tasks Section */}
        <section className="card p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-none shadow-xl">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-pink-500" /> Daily Missions
          </h2>
          <div className="space-y-3">
            {dashboardData.todayTasks.map((task) => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id, task.is_completed)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all group ${
                  task.is_completed 
                    ? 'bg-green-50/50 border-green-200 opacity-60' 
                    : 'bg-white dark:bg-gray-700 border-transparent shadow-sm hover:border-purple-100'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors ${task.is_completed ? 'bg-green-500 border-green-500' : 'border-gray-200 dark:border-gray-500'}`}>
                  {task.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                      {task.title}
                    </p>
                    {/* FIXED: The property now exists in Task interface */}
                    {task.created_by === 'parent' && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-black rounded-full uppercase tracking-tighter">
                        <ShieldCheck size={10} /> Parent Assigned
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{task.subject} • {task.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8 shadow-xl border-none">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <TrendingUp className="w-5 h-5 text-purple-500" /> Focus Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={stats?.focus_data || []}>
              <defs>
                <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="focus" stroke="#8B5CF6" strokeWidth={3} fill="url(#colorXP)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-8 shadow-xl border-none">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <Award className="w-5 h-5 text-pink-500" /> Skill Radar
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats?.behavior_data || []}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="subject" tick={{fill: '#6B7280', fontSize: 11, fontWeight: 'bold'}} />
              <Radar name="Skills" dataKey="value" stroke="#EC4899" fill="#EC4899" fillOpacity={0.5} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <WeeklyPlanner tasks={allTasks} onTaskUpdate={loadData} />
    </motion.div>
  );
}