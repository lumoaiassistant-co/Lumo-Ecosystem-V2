import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ArrowRight, Eye } from 'lucide-react';
import { Quiz } from '../../../types/quiz';

interface QuizMainCardProps {
  quiz: Quiz;
  onStart: (quiz: Quiz) => void;
  onReview: (quiz: Quiz) => void;
}

export default function QuizMainCard({ quiz, onStart, onReview }: QuizMainCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} className="card p-6 relative overflow-hidden bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{quiz.title}</h3>
          <p className="text-sm text-gray-500">{quiz.questions.length} Questions</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${
          quiz.is_completed ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {quiz.is_completed ? <><CheckCircle2 className="w-4 h-4" /> {quiz.score}%</> : <><Clock className="w-4 h-4" /> {quiz.duration_minutes}m</>}
        </div>
      </div>
      <button 
        onClick={() => quiz.is_completed ? onReview(quiz) : onStart(quiz)} 
        className={`w-full py-3 mt-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
          quiz.is_completed 
            ? 'bg-green-50 text-green-700 hover:bg-green-100' 
            : 'bg-gray-100 dark:bg-gray-700 hover:bg-purple-600 hover:text-white group'
        }`}
      >
        {quiz.is_completed ? <><Eye className="w-4 h-4" /> Review Results</> : <>Start Quiz <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
      </button>
    </motion.div>
  );
}