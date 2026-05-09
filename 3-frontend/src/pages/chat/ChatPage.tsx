import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Phone, PhoneOff, Clock } from 'lucide-react'; 
import { useSocket } from '../../contexts/SocketContext';
import { useChild } from '../../contexts/ChildContext';
import { chatService, ChatMessage } from '../../services/chatService'; 

// ✅ تم التعديل: استهلاك الـ CallContext بدلاً من الهوك المباشر
import { useCall } from '../../contexts/CallContext'; 
import CallActionButtons from '../../components/features/calls/CallActionButtons';

interface LumoChildProfile {
  child_email?: string;
  email?: string;
  name?: string;
}

export default function ChatPage() {
  const { sendMessage, socket, isConnected, setUnreadCount } = useSocket();
  const { activeChild } = useChild();
  
  // ✅ استخدام الـ Call Context العالمي
  const { startCall, setActivePartner } = useCall();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const userRole = localStorage.getItem('role');
  const userEmail = localStorage.getItem('userEmail')?.toLowerCase(); 
  const token = localStorage.getItem('token');
  const rawParentEmail = localStorage.getItem('parentEmail');
  
  const childInfo = activeChild as LumoChildProfile | null;

  const receiverEmail = userRole === 'child' 
    ? (rawParentEmail?.toLowerCase() || "") 
    : (childInfo?.child_email?.toLowerCase() || childInfo?.email?.toLowerCase() || "");

  // ✅ تحديث الشريك النشط عالمياً عند دخول صفحة الشات
  useEffect(() => {
    if (receiverEmail) {
      setActivePartner(receiverEmail);
    }
  }, [receiverEmail, setActivePartner]);

  const fetchHistory = useCallback(async () => {
    if (!receiverEmail || !token) return;
    try {
      setIsHistoryLoading(true);
      const data = await chatService.getHistory(receiverEmail, token);
      setMessages(data);
      await chatService.markAsRead(receiverEmail, token);
      setUnreadCount(0); 
    } catch (err) {
      console.error("❌ Failed to load chat history:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [receiverEmail, token, setUnreadCount]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !receiverEmail) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        const sender = data.sender_email?.toLowerCase();
        
        if (data.message && sender === receiverEmail) {
          setMessages(prev => {
            const isDuplicate = prev.some(m => 
              (m._id && m._id === data._id) || 
              (m.message === data.message && Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 1000)
            );
            return isDuplicate ? prev : [...prev, data];
          });
          if (token) chatService.markAsRead(receiverEmail, token);
        }
      } catch (err) { console.error("❌ Error parsing message:", err); }
    };

    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket, receiverEmail, token]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !receiverEmail || !isConnected || !userEmail) return;
    sendMessage(receiverEmail, input);
    const newMessage: ChatMessage = { sender_email: userEmail, receiver_email: receiverEmail, message: input, timestamp: new Date().toISOString(), is_read: true };
    setMessages(prev => [...prev, newMessage]);
    setInput("");
  };

  const formatDuration = (seconds: string) => {
    const s = parseInt(seconds);
    if (isNaN(s) || s === 0) return "";
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallLog = (logContent: string) => {
    const [, status, duration, role] = logContent.split(':');
    const isMissed = status === 'missed' || status === 'declined';
    let label = "";
    if (status === 'completed') label = "Call Ended";
    else if (status === 'declined') label = "Call Declined";
    else if (status === 'missed') {
        label = role === 'caller' ? "Missed Call" : "You missed a call";
    }

    return (
      <div className={`flex flex-col items-center gap-2 p-3 md:p-4 rounded-[2rem] border backdrop-blur-md transition-all ${
        isMissed 
        ? 'bg-red-500/5 border-red-500/10' 
        : 'bg-green-500/5 border-green-500/10'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isMissed ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
            {isMissed ? <PhoneOff size={16} /> : <Phone size={16} />}
          </div>
          <div className="text-left">
            <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest ${isMissed ? 'text-red-400/80' : 'text-green-400/80'}`}>
              {label}
            </p>
            {status === 'completed' && (
              <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold mt-0.5">
                <Clock size={10} />
                <span>Duration: {formatDuration(duration)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!receiverEmail && userRole === 'parent') return <div className="h-full w-full flex items-center justify-center dark:text-white font-bold">Select profile to chat</div>;

  return (
    <div className="flex flex-col h-full w-full bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border-none overflow-hidden shadow-none relative">
      
      {/* ⚠️ تم حذف الـ CallOverlay من هنا لأنه أصبح يظهر عالمياً من الـ CallProvider */}

      {/* Header */}
      <header className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-purple-pink rounded-2xl flex items-center justify-center text-lg md:text-xl shadow-lg text-white flex-shrink-0">
            {userRole === 'child' ? '🛡️' : '👶'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm md:text-lg dark:text-white truncate">
              {userRole === 'child' ? 'Chat with Parent' : `Chatting with ${childInfo?.name}`}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">
                {isConnected ? 'Live Sync' : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {isHistoryLoading && <Loader2 className="animate-spin text-purple-500" size={18} />}
          <CallActionButtons 
            onStartVoiceCall={() => startCall('voice')}
            onStartVideoCall={() => startCall('video')}
            disabled={!isConnected}
          />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-transparent">
        {messages.map((msg, idx) => {
          const isMe = msg.sender_email?.toLowerCase() === userEmail;
          const isCallLog = msg.message.startsWith('CALL_LOG:');

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg._id || idx}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {isCallLog ? (
                <div className="my-2 w-full max-w-[220px] md:max-w-[240px] opacity-90">
                    {renderCallLog(msg.message)}
                </div>
              ) : (
                <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-[1.5rem] md:rounded-[1.8rem] shadow-sm font-medium relative ${
                  isMe 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-700 rounded-tl-none'
                }`}>
                  <p className="text-sm md:text-base leading-relaxed">{msg.message}</p>
                  <span className={`block text-[8px] mt-1 opacity-60 font-black ${isMe ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Footer */}
      <footer className="p-4 md:p-6 bg-gray-50/40 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isConnected}
            placeholder="Type your message..."
            className="w-full p-4 md:p-5 pr-14 md:pr-16 bg-white dark:bg-gray-800 rounded-2xl outline-none border-2 border-transparent focus:border-purple-500 transition-all dark:text-white font-bold shadow-inner text-sm md:text-base"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className="absolute right-2 p-2.5 md:p-3 bg-purple-600 text-white rounded-xl hover:scale-105 active:scale-95 shadow-lg"
          >
            <Send className="w-[18px] h-[18px] md:w-[20px] md:h-[20px]" />
          </button>
        </form>
      </footer>
    </div>
  );
}