import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; 
import { BrainCircuit, Save, Lock, Loader2, Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useChild } from '../../contexts/ChildContext';
import { quizService } from '../../services/quizService';
import { Question } from '../../types/quiz';

export default function QuizMaker() {
  const { activeChild } = useChild();
  
  const [isLocked, setIsLocked] = useState(true);
  const [pin, setPin] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  // State الموحد للسؤال اليدوي (أفضل بكتير)
  const [manualQ, setManualQ] = useState<Question>({
    question_text: '',
    question_type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 5
  });

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const success = await quizService.verifyPin(pin);
      if (success) setIsLocked(false);
      else { alert("Incorrect PIN"); setPin(""); }
    } catch { alert("Connection Error"); }
    finally { setAuthLoading(false); }
  };

  const handleAiGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const data = await quizService.generateQuiz({ topic, num_questions: 5, difficulty: 'medium' });
      setQuestions(data);
      setTitle(`${topic} Quiz`);
    } catch { alert("AI Generation failed"); }
    finally { setLoading(false); }
  };

  const addManualQuestion = () => {
    if (!manualQ.question_text || !manualQ.correct_answer) {
        alert("Please fill the question and correct answer");
        return;
    }
    setQuestions(prev => [...prev, { ...manualQ }]);
    setManualQ({
      question_text: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 5
    });
  };

  const handleSaveQuiz = async () => {
    if (!activeChild) return alert("Please select a child in Settings first.");
    if (!title || questions.length === 0) return alert("Please add a title and some questions.");

    const success = await quizService.saveQuiz({
      title, questions, child_id: activeChild.id
    });
    if (success) {
      alert("Quiz assigned successfully!");
      setQuestions([]);
      setTitle("");
      setTopic("");
    }
  };

  if (isLocked) return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-8 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Parent Access Only</h2>
        <p className="text-gray-500 mb-8">Enter your PIN to manage quizzes.</p>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input 
            type="password" value={pin} onChange={e => setPin(e.target.value)}
            className="w-full text-center text-3xl tracking-[0.5em] p-4 rounded-2xl border-2 outline-none focus:border-purple-500 transition-all"
            placeholder="••••" maxLength={4}
          />
          <button disabled={authLoading} className="btn-primary w-full py-4 flex justify-center text-lg">
            {authLoading ? <Loader2 className="animate-spin" /> : "Verify PIN"}
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold bg-gradient-purple-pink bg-clip-text text-transparent">Quiz Maker 🛠️</h1>
          <p className="text-gray-500">Creating for: <b className="text-purple-600">{activeChild?.name || 'No child selected'}</b></p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl shadow-inner">
          <button onClick={() => setMode('ai')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'ai' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>AI Mode</button>
          <button onClick={() => setMode('manual')} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>Manual</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <aside className="space-y-6">
          {/* Settings Section */}
          <div className="card p-6 border-t-4 border-purple-500">
            <h3 className="font-bold mb-4 flex items-center gap-2">Quiz Details</h3>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl border mb-4 outline-none focus:ring-2 focus:ring-purple-400" placeholder="Quiz Title (e.g. Science Part 1)" />
            
            {mode === 'ai' ? (
              <div className="space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                   <p className="text-xs text-purple-600 font-bold mb-2 uppercase">AI Topic</p>
                   <input value={topic} onChange={e => setTopic(e.target.value)} className="w-full p-2 bg-transparent border-b border-purple-200 outline-none" placeholder="e.g. Solar System" />
                </div>
                <button onClick={handleAiGenerate} disabled={loading} className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" /> : <><BrainCircuit className="w-5 h-5"/> Generate</>}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <textarea 
                  value={manualQ.question_text} 
                  onChange={e => setManualQ({...manualQ, question_text: e.target.value})}
                  className="w-full p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-purple-400" placeholder="Question text..." rows={3}
                />
                <div className="space-y-2">
                   <p className="text-[10px] font-bold text-gray-400 uppercase">Options (MCQ)</p>
                   {manualQ.options.map((opt, i) => (
                     <input key={i} value={opt} onChange={e => {
                       const newOpts = [...manualQ.options]; newOpts[i] = e.target.value; setManualQ({...manualQ, options: newOpts});
                     }} className="w-full p-2 text-xs rounded-lg border bg-gray-50" placeholder={`Option ${i+1}`} />
                   ))}
                </div>
                <input 
                  value={manualQ.correct_answer}
                  onChange={e => setManualQ({...manualQ, correct_answer: e.target.value})}
                  className="w-full p-3 rounded-xl border text-sm bg-green-50 border-green-100" placeholder="Correct Answer" 
                />
                <button onClick={addManualQuestion} className="w-full bg-gray-900 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg">
                  <Plus className="w-4 h-4" /> Add to List
                </button>
              </div>
            )}
          </div>

          {questions.length > 0 && (
            <motion.button initial={{ y: 20 }} animate={{ y: 0 }} onClick={handleSaveQuiz} className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-green-600 transition-all flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> Save & Assign Quiz
            </motion.button>
          )}
        </aside>

        <main className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {questions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-96 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                <p className="font-medium">Quiz list is empty.</p>
                <p className="text-xs">Add questions manually or generate with AI.</p>
              </motion.div>
            ) : (
              questions.map((q, idx) => (
                <motion.div key={idx} layout initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="card p-6 relative group border-l-4 border-purple-500">
                  <button onClick={() => setQuestions(prev => prev.filter((_, i) => i !== idx))} className="absolute top-4 right-4 text-red-400 opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="text-lg font-bold mb-4">{q.question_text}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map(opt => (
                          <div key={opt} className={`p-3 rounded-xl border text-sm flex justify-between items-center ${opt === q.correct_answer ? 'bg-green-50 border-green-200 text-green-700 font-bold' : 'bg-gray-50'}`}>
                            {opt}
                            {opt === q.correct_answer && <CheckCircle2 className="w-4 h-4" />}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}