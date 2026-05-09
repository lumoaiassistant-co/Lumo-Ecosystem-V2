import { motion } from 'framer-motion';
import { Calendar, Plus, BookOpen, Trash2, Clock } from 'lucide-react'; // شيلنا الـ X والـ Clock لو مش هتستخدمهم تحت
import { useState } from 'react';
import { useChild } from '../contexts/ChildContext';
import { dashboardService } from '../services/dashboardService';
import { Task } from '../types/dashboard';
import AddTaskModal from './features/dashboard/AddTaskModal'; // <--- ده الـ Import اللي كان ناقص

interface WeeklyPlannerProps {
  tasks: Task[];
  onTaskUpdate: () => void;
}

const DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export default function WeeklyPlanner({ tasks, onTaskUpdate }: WeeklyPlannerProps) {
  const { activeChild } = useChild();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // === Delete Task ===
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (await dashboardService.deleteTask(id)) {
      onTaskUpdate();
    }
  };

  // === Drag & Drop ===
  const handleDrop = async (toDay: string) => {
    if (!draggedTask || draggedTask.day === toDay) return;
    const success = await dashboardService.updateTask(draggedTask.id, draggedTask.is_completed, toDay);
    if (success) {
      setDraggedTask(null);
      onTaskUpdate();
    }
  };

  const getTasksForDay = (day: string) => tasks.filter(t => t.day === day);

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-semibold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-lavender-500" /> Weekly Study Planner
          </h2>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Add Task
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {DAYS.map((day) => ( // شيلنا الـ index عشان مكنش مستخدم (حل خطأ ESLint)
            <div key={day} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(day)} className="space-y-3">
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{day.slice(0, 3)}</h3>
                <div className="text-xs text-gray-500">{getTasksForDay(day).length} tasks</div>
              </div>

              <div className={`min-h-[300px] p-2 rounded-2xl border-2 border-dashed transition-all ${draggedTask && draggedTask.day !== day ? 'border-lavender-400 bg-lavender-50/50' : 'border-gray-200 dark:border-gray-700'}`}>
                {getTasksForDay(day).map((task) => (
                  <motion.div
                    key={task.id} draggable onDragStart={() => setDraggedTask(task)}
                    className={`p-3 rounded-xl cursor-move mb-2 ${task.color} relative group ${task.is_completed ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <h4 className={`font-medium text-sm pr-4 ${task.is_completed ? 'line-through' : ''}`}>{task.title}</h4>
                    </div>
                    {/* استخدمنا الـ Clock هنا عشان ما تطلعش Error برضه */}
                    <div className="flex items-center gap-1 text-[10px] opacity-70">
                      <Clock className="w-3 h-3" /> {task.duration}
                    </div>
                    <button onClick={(e) => handleDelete(task.id, e)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* الـ Modal الجديد بالـ Props النضيفة */}
      <AddTaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onTaskUpdate}
        activeChildId={activeChild?.id}
        activeChildName={activeChild?.name}
      />
    </>
  );
}