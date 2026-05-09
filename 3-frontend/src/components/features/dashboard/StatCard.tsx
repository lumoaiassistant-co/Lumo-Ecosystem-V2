import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string | React.ReactNode;
  progress?: number;
  colorClass?: string;
  isCustom?: boolean;
}

export const StatCard = ({ title, value, icon, progress, colorClass, isCustom }: StatCardProps) => (
  <motion.div whileHover={{ scale: 1.02 }} className={`card p-6 ${colorClass || 'bg-white'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-16 h-16 ${isCustom ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'} rounded-full flex items-center justify-center text-3xl`}>
        {icon}
      </div>
      <div className="text-right">
        <div className={`text-sm ${isCustom ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>{title}</div>
        <div className={`text-3xl font-bold ${isCustom ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{value}</div>
      </div>
    </div>
    {progress !== undefined && (
      <div className={`w-full ${isCustom ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'} rounded-full h-2 mt-4`}>
        <motion.div 
          initial={{ width: 0 }} 
          animate={{ width: `${progress}%` }} 
          className={`${isCustom ? 'bg-white' : 'bg-green-500'} h-2 rounded-full`} 
        />
      </div>
    )}
  </motion.div>
);