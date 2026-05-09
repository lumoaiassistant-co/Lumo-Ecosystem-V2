import { motion } from 'framer-motion';
import { Award } from 'lucide-react';

interface ResultViewProps {
  score: number;
  onBack: () => void;
}

export default function ResultView({ score, onBack }: ResultViewProps) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-12 text-center bg-white dark:bg-gray-800">
      <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
        <Award className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h2 className="text-4xl font-bold mb-2 text-gray-800 dark:text-white">You scored {score}%!</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Excellent work! Lumo is proud of you. 🌟</p>
      <button onClick={onBack} className="btn-primary px-8 py-3 rounded-xl shadow-lg">Back to Dashboard</button>
    </motion.div>
  );
}