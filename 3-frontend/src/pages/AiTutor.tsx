import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, AlertTriangle, Plus, History, MessageSquare, Trash2, AlertCircle, X, Paperclip } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChild } from '../contexts/ChildContext';
import { aiService } from '../services/aiService'; 
import { Message, ChatSession } from '../types/ai';

export default function AiTutor() {
  const { activeChild } = useChild();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // ✅ المرجع لرفع الملفات

  // === 1. جلب الجلسات والترحيب الأول ===
  const fetchSessions = useCallback(async () => {
    try {
      const data = await aiService.getSessions(activeChild?.id);
      setSessions(data);
    } catch { /* Error handled silently */ }
  }, [activeChild]);

  const handleNewChat = useCallback(() => {
    const greeting = activeChild 
      ? `Hi ${activeChild.name}! I'm Lumo. What are we learning today? 🚀`
      : "Hi! I'm Lumo. What's on your mind? 🚀";
      
    setMessages([{ id: 'intro', role: 'model', text: greeting }]);
    setActiveSessionId(null);
    setShowHistory(false);
  }, [activeChild]);

  useEffect(() => {
    fetchSessions();
    handleNewChat();
  }, [activeChild, fetchSessions, handleNewChat]);

  // === 2. التمرير التلقائي لأسفل الشات ===
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // === 3. تحميل جلسة قديمة ===
  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    setActiveSessionId(sessionId);
    setShowHistory(false); 
    try {
      const history = await aiService.getHistory(sessionId);
      setMessages(history.map(msg => ({
        id: msg.id || msg._id || Math.random().toString(),
        role: msg.role,
        text: msg.text
      })));
    } catch { /* Handle error */ }
    finally { setIsLoading(false); }
  };

  // === 4. إرسال الرسالة ===
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await aiService.sendMessage(userMessage.text, activeSessionId, activeChild?.id);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: data.response }]);
      
      if (!activeSessionId && data.session_id) {
        setActiveSessionId(data.session_id);
        fetchSessions();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: `⚠️ ${msg}`, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  // === 5. مسح الجلسة ===
  const confirmDelete = async () => {
    if (!sessionToDelete) return;
    if (await aiService.deleteSession(sessionToDelete)) {
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      if (sessionToDelete === activeSessionId) handleNewChat();
    }
    setIsDeleteModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden p-2 lg:p-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div className="flex items-center justify-between px-2 lg:px-0">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              AI Tutor <Sparkles className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-400" />
            </h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handleNewChat} className="btn-secondary flex items-center gap-2 px-3 lg:px-4 py-2 text-xs lg:text-sm whitespace-nowrap">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Chat</span>
            </button>
            <button onClick={() => setShowHistory(!showHistory)} className="lg:hidden p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <History className="w-5 h-5 text-gray-600 dark:text-gray-200" />
            </button>
          </div>
        </div>

        {/* Chat Box */}
        <div className="flex-1 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden shadow-sm">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'model' ? 'bg-gradient-purple-pink text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {msg.role === 'model' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5 dark:text-gray-300" />}
                </div>
                <div className={`max-w-[85%] lg:max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'model' ? 'bg-gray-100 dark:bg-gray-700 dark:text-gray-100' : 'bg-purple-600 text-white'}`}>
                  {msg.isError && <AlertTriangle className="w-4 h-4 inline mr-2 text-red-500" />}
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {isLoading && <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto mt-4" />}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 lg:p-4 border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <div className="relative flex items-center gap-2 max-w-5xl mx-auto">
              {/* ✅ زرار رفع الملفات الجديد */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Upload file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={(e) => console.log(e.target.files?.[0])} 
              />
              
              <div className="relative flex-1">
                <input 
                  type="text" value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="w-full p-3 lg:p-4 pr-12 rounded-2xl bg-gray-50 dark:bg-gray-900 dark:text-white outline-none border border-transparent focus:border-purple-400 transition-all"
                  placeholder="Ask Lumo..."
                />
                <button 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 lg:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar History (LG screens) */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-gray-900 p-6 lg:relative lg:block ${showHistory ? 'translate-x-0 shadow-2xl lg:shadow-none' : 'translate-x-full lg:translate-x-0'} transition-transform border-l border-gray-100 dark:border-gray-700 h-full`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold flex items-center gap-2 dark:text-white text-lg"><MessageSquare className="w-4 h-4" /> History</h3>
          <button onClick={() => setShowHistory(false)} className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2 overflow-y-auto h-[calc(100%-4rem)] pb-10 custom-scrollbar">
          {sessions.map(s => (
            <div 
              key={s.id} onClick={() => loadSession(s.id)}
              className={`p-3 lg:p-4 rounded-2xl cursor-pointer border flex justify-between items-center group transition-all ${activeSessionId === s.id ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <span className="text-sm font-medium truncate flex-1">{s.title}</span>
              <Trash2 
                onClick={(e) => { e.stopPropagation(); setSessionToDelete(s.id); setIsDeleteModalOpen(true); }}
                className="w-4 h-4 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" 
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white dark:bg-gray-800 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2 dark:text-white">Delete Chat?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">This will permanently remove the conversation.</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 p-3 border rounded-2xl dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 p-3 bg-red-500 text-white rounded-2xl hover:bg-red-600 transition-colors font-bold">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}