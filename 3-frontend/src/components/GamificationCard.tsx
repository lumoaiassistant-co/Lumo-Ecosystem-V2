import { motion } from 'framer-motion';
import { Trophy, Star, Medal } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface GamificationProps {
  xp: number;
  level: number;
  badges: Badge[];
}

export default function GamificationCard({ xp, level, badges }: GamificationProps) {
  // Calculate progress to next level (assuming 100 XP per level)
  const progress = (xp % 100); 

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
              Level {level}
            </h2>
            <p className="text-indigo-100 text-sm">Keep learning to level up!</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold">{xp}</span>
            <span className="text-indigo-200 text-sm ml-1">XP</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1 text-indigo-200">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${progress}%` }} 
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-yellow-400 h-3 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.6)]" 
            />
          </div>
        </div>

        {/* Badges */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2 text-indigo-100">
            <Medal className="w-4 h-4" /> Recent Badges
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {badges.length === 0 ? (
              <p className="text-sm text-indigo-200 italic">Complete tasks to earn badges!</p>
            ) : (
              badges.map((badge) => (
                <motion.div 
                  key={badge.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex flex-col items-center bg-white/10 backdrop-blur-md p-3 rounded-xl min-w-[80px] border border-white/10"
                  title={badge.description}
                >
                  <span className="text-2xl mb-1 filter drop-shadow-md">{badge.icon}</span>
                  <span className="text-[10px] text-center font-medium leading-tight">{badge.name}</span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}