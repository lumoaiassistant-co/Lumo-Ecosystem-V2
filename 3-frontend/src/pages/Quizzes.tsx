import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, ArrowRight, Award, Eye } from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { quizService } from '../services/quizService';
import { Quiz, Question, QuizMode } from '../types/quiz';
import FocusGuard from '../components/FocusGuard';

export default function Quizzes() {
  const { activeChild } = useChild();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [mode, setMode] = useState<QuizMode>('list');
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const loadQuizzes = useCallback(async () => {
    if (!activeChild) return;
    try {
      const data = await quizService.getQuizzes(activeChild.id);
      setQuizzes(data);
    } catch (err) { console.error(err); }
  }, [activeChild]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes, mode]);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers({});
    setShowResult(false);
    setMode('taking');
  };

  const reviewQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setAnswers(quiz.user_answers || {});
    setScore(quiz.score);
    setShowResult(true); 
    setMode('review');
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    
    let earnedPoints = 0;
    let totalPoints = 0;

    activeQuiz.questions.forEach((q, idx) => {
      totalPoints += q.points;
      if (answers[idx]?.trim().toLowerCase() === q.correct_answer.trim().toLowerCase()) {
        earnedPoints += q.points;
      }
    });
    
    const finalScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    
    try {
      await quizService.submitQuiz(activeQuiz.id, { score: finalScore, user_answers: answers });
      setScore(finalScore);
      setShowResult(true);
    } catch (err) { console.error(err); }
  };

  if (mode === 'taking' || mode === 'review') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {mode === 'taking' && <FocusGuard />}
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-display font-bold text-gray-800 dark:text-white">
            {activeQuiz?.title} 
            {mode === 'review' && <span className="text-gray-400 text-lg ml-3 font-normal">(Review Mode)</span>}
          </h1>
          <button onClick={() => setMode('list')} className="text-gray-500 hover:text-purple-600 transition-colors">Exit Quiz</button>
        </div>

        {(!showResult || mode === 'review') ? (
          <div className="space-y-6">
            {activeQuiz?.questions.map((q, idx) => (
               <QuestionCard 
                  key={idx} 
                  question={q} 
                  index={idx} 
                  userAnswer={answers[idx]} 
                  mode={mode} 
                  onAnswer={(val: string) => setAnswers({...answers, [idx]: val})} 
               />
            ))}
            {mode === 'taking' && (
              <button onClick={handleSubmit} className="btn-primary w-full py-4 text-lg shadow-xl mt-8">Submit Quiz</button>
            )}
          </div>
        ) : (
          <ResultView score={score} onBack={() => { setMode('list'); setActiveQuiz(null); }} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-display font-bold text-gray-800 dark:text-gray-100">Quizzes 📝</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map(quiz => (
           <QuizMainCard key={quiz.id} quiz={quiz} onStart={startQuiz} onReview={reviewQuiz} />
        ))}
      </div>
    </div>
  );
}

// --- Sub-components Sections ---

interface QuestionCardProps {
  question: Question;
  index: number;
  userAnswer: string | undefined;
  mode: QuizMode;
  onAnswer: (val: string) => void;
}

function QuestionCard({ question, index, userAnswer, mode, onAnswer }: QuestionCardProps) {
  const isCorrect = userAnswer?.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
  return (
    <div className={`card p-6 border-2 transition-all ${mode === 'review' ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30') : 'border-transparent'}`}>
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-medium dark:text-white">{index + 1}. {question.question_text}</h3>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-bold text-gray-500">{question.points} pts</span>
      </div>
      {question.question_type === 'mcq' ? (
        <div className="grid gap-3">
          {question.options.map((opt) => (
            <button 
              key={opt} disabled={mode === 'review'} onClick={() => onAnswer(opt)}
              className={`p-4 rounded-xl text-left border-2 transition-all ${
                mode === 'taking' && userAnswer === opt ? 'border-purple-500 bg-purple-50' : 'border-gray-100 dark:border-gray-700'
              } ${mode === 'review' && opt === question.correct_answer ? 'border-green-500 bg-green-50 text-green-700' : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input 
          disabled={mode === 'review'} value={userAnswer || ""} onChange={e => onAnswer(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-gray-100 dark:bg-gray-800 outline-none focus:border-purple-500"
          placeholder="Type your answer..."
        />
      )}
    </div>
  );
}

function ResultView({ score, onBack }: { score: number; onBack: () => void }) {
  return (
    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="card p-12 text-center">
      <Award className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
      <h2 className="text-4xl font-bold mb-2 dark:text-white">You scored {score}%!</h2>
      <button onClick={onBack} className="btn-primary px-8 mt-6">Back to Dashboard</button>
    </motion.div>
  );
}

function QuizMainCard({ quiz, onStart, onReview }: { quiz: Quiz; onStart: (q: Quiz) => void; onReview: (q: Quiz) => void }) {
  return (
    <motion.div whileHover={{ y: -5 }} className="card p-6 relative overflow-hidden bg-white dark:bg-gray-800">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold dark:text-white">{quiz.title}</h3>
          <p className="text-sm text-gray-500">{quiz.questions.length} Questions</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${quiz.is_completed ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
          {quiz.is_completed ? <><CheckCircle2 className="w-4 h-4" /> {quiz.score}%</> : <><Clock className="w-4 h-4" /> {quiz.duration_minutes}m</>}
        </div>
      </div>
      <button 
        onClick={() => quiz.is_completed ? onReview(quiz) : onStart(quiz)} 
        className="w-full py-3 mt-4 rounded-xl font-medium transition-all bg-gray-100 dark:bg-gray-700 hover:bg-purple-600 hover:text-white flex items-center justify-center gap-2 group"
      >
        {quiz.is_completed ? <><Eye className="w-4 h-4" /> Review Results</> : <>Start Quiz <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
      </button>
    </motion.div>
  );
}