import { Question, QuizMode } from '../../../types/quiz';

interface QuestionCardProps {
  question: Question;
  index: number;
  userAnswer: string | undefined;
  mode: QuizMode;
  onAnswer: (val: string) => void;
}

export default function QuestionCard({ question, index, userAnswer, mode, onAnswer }: QuestionCardProps) {
  const isCorrect = userAnswer?.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();
  
  return (
    <div className={`card p-6 border-2 transition-all ${
      mode === 'review' 
        ? (isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30') 
        : 'border-transparent dark:bg-gray-800/50'
    }`}>
      <div className="flex justify-between mb-4">
        <h3 className="text-xl font-medium dark:text-gray-100">{index + 1}. {question.question_text}</h3>
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-bold text-gray-500">{question.points} pts</span>
      </div>

      {question.question_type === 'mcq' ? (
        <div className="grid gap-3">
          {question.options.map((opt) => {
            let style = "border-gray-100 dark:border-gray-700 hover:border-purple-200";
            if (mode === 'taking' && userAnswer === opt) style = "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700";
            if (mode === 'review') {
              if (opt === question.correct_answer) style = "border-green-500 bg-green-100 text-green-800 font-bold";
              else if (userAnswer === opt) style = "border-red-500 bg-red-100 text-red-800 opacity-100";
              else style = "opacity-50";
            }
            return (
              <button 
                key={opt} 
                disabled={mode === 'review'} 
                onClick={() => onAnswer(opt)} 
                className={`p-4 rounded-xl text-left border-2 transition-all ${style}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <input 
          disabled={mode === 'review'} 
          value={userAnswer || ""} 
          onChange={e => onAnswer(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-gray-100 dark:bg-gray-700 dark:border-gray-600 focus:border-purple-500 outline-none dark:text-white"
          placeholder="Type your answer..."
        />
      )}
    </div>
  );
}