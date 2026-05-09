import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ChevronLeft, BrainCircuit, MessageCircle, X, Bot, User, Sparkles, AlertTriangle, Code } from 'lucide-react'; 
import { studyService, Book } from '../services/studyService';
import { aiService } from '../services/aiService';
import { useChild } from '../contexts/ChildContext';

// ✅ استيراد مكتبة تلوين الأكواد
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const { activeChild } = useChild();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, id: string, isError?: boolean}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  
  // ✅ State لتخزين الـ Session ID لضمان تجميع الرسايل في شات واحد
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. جلب بيانات الكتاب والترحيب الشخصي
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const books = await studyService.getBooks('', 'all');
        const found = books.find(b => b.id === bookId);
        if (found) {
          setBook(found);
          const greeting = activeChild 
            ? `Hi ${activeChild.name}! I'm so excited to read "${found.title}" with you! 📚 Ask me anything about it. [happy]`
            : `Hi! I'm so excited to read "${found.title}" with you! 📚 Ask me anything about it. [happy]`;
            
          setMessages([{ id: 'intro', role: 'model', text: greeting }]);
        }
      } catch {
        console.error("Error loading book");
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [bookId, activeChild]);

  // 2. التمرير التلقائي لآخر رسالة
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // 3. إرسال الرسالة للـ AI مع ربط الجلسة (Session ID)
  const handleSendMessage = async () => {
    if (!input.trim() || !bookId || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      // ✅ نرسل الـ activeSessionId لو موجود، والـ bookId لربط السياق
      const res = await aiService.sendMessage(userMessage, activeSessionId, activeChild?.id, bookId);
      
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: res.response }]);
      
      // ✅ حفظ الـ Session ID اللي راجع من الباك إند عشان الرسايل اللي جاية تروح عليه
      if (!activeSessionId && res.session_id) {
        setActiveSessionId(res.session_id);
      }
    } catch {
      setMessages(prev => [...prev, { 
        id: 'err', 
        role: 'model', 
        text: "I'm a bit sleepy, can you say that again? [confused]",
        isError: true 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse uppercase tracking-tighter font-display text-lg">Lumo is opening the book...</p>
    </div>
  );

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden relative">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/study')} className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-xl transition-all text-gray-500 hover:text-purple-600">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-bold text-gray-900 dark:text-white line-clamp-1">{book?.title}</h1>
            <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest flex items-center gap-1">
               <Sparkles size={10} /> Studying Mode
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsChatExpanded(!isChatExpanded)}
          className="lg:hidden p-2.5 bg-gradient-purple-pink text-white rounded-xl shadow-lg active:scale-95 transition-all"
        >
          <MessageCircle size={20} />
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* PDF Viewer Section */}
        <section className={`flex-1 bg-gray-200 dark:bg-gray-800 transition-all duration-500`}>
          {book?.file_url ? (
            <iframe 
              src={`${book.file_url}#toolbar=0`} 
              className="w-full h-full border-none"
              title="PDF Reader"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <AlertTriangle size={48} />
              <p className="font-bold">PDF source not found.</p>
            </div>
          )}
        </section>

        {/* AI Tutor Sidebar */}
        <AnimatePresence>
          {isChatExpanded && (
            <motion.aside 
              initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
              className="fixed lg:relative top-0 right-0 h-full w-[85%] lg:w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-white/5 flex flex-col z-30 shadow-2xl lg:shadow-none"
            >
              <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-purple-50/50 dark:bg-purple-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-purple-pink rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Bot size={22} />
                  </div>
                  <div>
                    <span className="block font-black text-gray-900 dark:text-white uppercase tracking-tighter text-sm">Lumo Tutor</span>
                    <span className="text-[10px] text-green-500 font-bold flex items-center gap-1">● Online</span>
                  </div>
                </div>
                <button onClick={() => setIsChatExpanded(false)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/50">
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${msg.role === 'model' ? 'bg-gradient-purple-pink text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                      {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5 dark:text-gray-300" />}
                    </div>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-md ${
                      msg.role === 'model' 
                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-purple-100 dark:border-purple-900/20' 
                        : 'bg-purple-600 text-white rounded-tr-none'
                    }`}>
                      {msg.isError && <AlertTriangle className="w-4 h-4 inline mr-2 text-red-500" />}
                      
                      {/* ✅ محرك عرض الرسائل المطور لدعم تلوين الأكواد */}
                      <div className="whitespace-pre-wrap space-y-3">
                        {msg.text.split(/(```[\s\S]*?```)/g).map((part, i) => {
                          // إذا كان الجزء عبارة عن كود برمجى
                          if (part.startsWith('```')) {
                            const match = part.match(/```(\w+)?\n?([\s\S]*?)```/);
                            const language = match?.[1] || 'text';
                            const codeContent = match?.[2] || '';

                            return (
                              <div key={i} className="my-4 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                                <div className="bg-gray-800 text-gray-400 px-4 py-1.5 text-[10px] uppercase font-black flex items-center justify-between border-b border-gray-700">
                                  <div className="flex items-center gap-2">
                                    <Code size={12} className="text-purple-400" />
                                    <span>{language}</span>
                                  </div>
                                  <span className="opacity-50">Lumo Code Engine</span>
                                </div>
                                <SyntaxHighlighter 
                                  language={language} 
                                  style={vscDarkPlus}
                                  customStyle={{ margin: 0, padding: '1rem', fontSize: '0.8rem', backgroundColor: '#1e1e1e' }}
                                >
                                  {codeContent.trim()}
                                </SyntaxHighlighter>
                              </div>
                            );
                          }

                          // إذا كان نصاً عادياً، نطبق عليه التنسيق المعتاد
                          return (
                            <div key={i} className="space-y-2">
                              {part.split('\n').map((line, j) => {
                                if (!line.trim()) return <div key={j} className="h-1" />;
                                const isSpecialHeader = line.startsWith('🌟') || line.startsWith('📝') || line.startsWith('💡');
                                
                                return (
                                  <p key={j} className={`${isSpecialHeader ? 'font-bold text-purple-600 dark:text-purple-400 mt-3 text-base' : ''}`}>
                                    {line.split(/(\*\*.*?\*\*)/g).map((subPart, index) => {
                                      if (subPart.startsWith('**') && subPart.endsWith('**')) {
                                        return (
                                          <strong key={index} className="font-black text-purple-700 dark:text-purple-300">
                                            {subPart.replace(/\*\*/g, '')}
                                          </strong>
                                        );
                                      }
                                      return subPart;
                                    })}
                                  </p>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl animate-pulse border border-purple-100 dark:border-purple-900/20 shadow-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-gray-900">
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" value={input} 
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask Lumo about this book..."
                      className="w-full pl-4 pr-12 py-4 bg-gray-100 dark:bg-gray-800 dark:text-white border border-transparent focus:border-purple-500 rounded-2xl outline-none text-sm transition-all shadow-inner"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isTyping}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Floating Button */}
        {!isChatExpanded && (
          <button 
            onClick={() => setIsChatExpanded(true)}
            className="fixed bottom-6 right-6 p-4 bg-gradient-purple-pink text-white rounded-2xl shadow-2xl hover:scale-110 active:scale-95 transition-all z-40 flex items-center gap-3 group"
          >
            <BrainCircuit className="animate-pulse" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Ask Lumo Tutor</span>
          </button>
        )}
      </div>
    </div>
  );
}