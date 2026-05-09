import { motion } from 'framer-motion';
import { 
  Target, Award, Clock, 
  Loader2, Bell, CheckCircle2, MoreVertical, 
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie 
} from 'recharts';
import { useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { useChild } from '../../contexts/ChildContext';
import { UserProfile, DashboardStats, Task } from '../../types/dashboard';

// ✅ إضافة كارت حالة الرؤية الذكي
import VisionStatsCard from '../../components/features/dashboard/VisionStatsCard';

// تعريف الـ Props للـ StatCard
interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}

export default function ParentDashboard() {
  const navigate = useNavigate();
  const { activeChild } = useChild();
  
  const [parent, setParent] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParentData = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, statsData, tasksData] = await Promise.all([
        dashboardService.getUserMe(),
        dashboardService.getStats(activeChild?.id),
        dashboardService.getTasks(activeChild?.id)
      ]);

      setParent(userData);
      setStats(statsData);
      setTasks(tasksData);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeChild]);

  useEffect(() => { loadParentData(); }, [loadParentData]);

  const chartData = useMemo(() => {
    const completed = tasks.filter(t => t.is_completed).length;
    const pending = tasks.length - completed;
    
    const pie = [
      { name: 'Completed', value: completed, color: '#10B981' },
      { name: 'Pending', value: pending, color: '#8B5CF6' },
    ];

    const bar = stats?.behavior_data || [];

    const avgFocus = stats?.focus_data?.length 
      ? Math.round(stats.focus_data.reduce((acc, curr) => acc + curr.focus, 0) / stats.focus_data.length)
      : 0;

    return { pie, bar, totalTasks: tasks.length, completed, avgFocus };
  }, [tasks, stats]);

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      
      {/* Header */}
      <header>
        <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-white">
          Parent Control Panel 🛡️
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {parent?.firstName}. Monitoring <b>{activeChild?.name || 'All Profiles'}</b>
        </p>
      </header>

      {/* --- 1. Top Stats Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Child Level" value={stats?.current_level || 1} icon={<Award />} color="bg-blue-500" />
        <StatCard title="Current XP" value={stats?.current_xp || 0} icon={<Target />} color="bg-purple-500" />
        <StatCard title="Tasks Progress" value={`${chartData.completed}/${chartData.totalTasks}`} icon={<CheckCircle2 />} color="bg-green-500" />
        <StatCard title="Avg Focus Rate" value={`${chartData.avgFocus}%`} icon={<Clock />} color="bg-orange-500" />
      </div>

      {/* الحالة لما ميكونش فيه طفل مختار */}
      {!activeChild ? (
        <div className="card p-12 text-center bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 rounded-[2.5rem]">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200">No Child Selected</h3>
          <p className="text-amber-700 dark:text-amber-400">Please select or add a child profile to view real-time performance analytics.</p>
          
          <button 
            onClick={() => navigate('/parent/kids')} 
            className="mt-4 bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
          >
            Go to Manage Kids
          </button>
        </div>
      ) : (
        <>
          {/* ✅ رادار التشتت اللحظي - يظهر فقط عند اختيار طفل */}
          <section>
             <VisionStatsCard />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Subject Mastery Chart */}
            <div className="lg:col-span-2 card p-8 shadow-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-[2.5rem]">
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-800 dark:text-white">Subject Mastery</h2>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.bar}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overall Progress Pie */}
            <div className="card p-8 shadow-xl bg-white/80 dark:bg-gray-800/80 rounded-[2.5rem]">
              <h2 className="text-2xl font-display font-bold mb-8 text-gray-800 dark:text-white">Overall Progress</h2>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData.pie} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                      {chartData.pie.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 mt-4">
                {chartData.pie.map(item => (
                  <div key={item.name} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <span className="text-sm font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /> {item.name}
                    </span>
                    <span className="font-bold">{item.value} Tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Logs */}
            <section className="card p-8 shadow-xl rounded-[2.5rem] bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-display font-bold mb-6 flex items-center gap-2 text-gray-800 dark:text-white">
                <Bell className="text-purple-500" /> Recent Logs
              </h2>
              <div className="space-y-6">
                {stats?.notifications?.length === 0 ? (
                  <p className="text-gray-400 text-center py-10">No recent logs found.</p>
                ) : (
                  stats?.notifications?.slice(0, 4).map((notif) => (
                    <div key={notif.id} className="flex gap-4 items-start border-b border-gray-50 dark:border-gray-700 pb-4 last:border-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-lg">
                        {notif.type === 'warning' ? '⚠️' : '🎯'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tighter">{notif.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Mission Tracker */}
            <section className="card p-8 shadow-xl rounded-[2.5rem] bg-white dark:bg-gray-800">
              <h2 className="text-2xl font-display font-bold mb-6 text-gray-800 dark:text-white">Mission Tracker</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 uppercase text-[10px] font-black border-b border-gray-100 dark:border-gray-700">
                      <th className="pb-4">Task</th>
                      <th className="pb-4 text-center">Status</th>
                      <th className="pb-4 text-right">More</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {tasks.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-10 text-gray-400">No missions found.</td></tr>
                    ) : (
                      tasks.slice(0, 5).map((task) => (
                        <tr key={task.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-4">
                            <p className="font-bold text-gray-800 dark:text-gray-200">{task.title}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">{task.subject}</p>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${task.is_completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {task.is_completed ? 'DONE' : 'PENDING'}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </motion.div>
  );
}

// مكون فرعي StatCard
function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} className="card p-6 border-none shadow-xl bg-white/60 dark:bg-gray-800/60 flex items-center gap-5 rounded-[2rem]">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-display font-bold mt-1 text-gray-800 dark:text-white">{value}</p>
      </div>
    </motion.div>
  );
}