import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import toast from 'react-hot-toast'; 
import { useLocation } from 'react-router-dom';

// --- Interfaces ---
interface Message {
  id: string;
  sender_email: string;
  message: string;
  timestamp: string;
}

interface CallData {
  sender_email: string;
  type: 'voice' | 'video';
  signal_data?: unknown;
}

interface DistractionAlert {
  child_name: string;
  status: string;
  snapshot?: string; 
}

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastActive: Record<string, number>; 
  sendMessage: (receiver: string, msg: string) => void;
  sendCallSignal: (receiver: string, type: string, data: unknown) => void;
  emitEvent: (type: string, receiver: string, data: unknown) => void; 
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  incomingCall: CallData | null;
  setIncomingCall: React.Dispatch<React.SetStateAction<CallData | null>>;
  stopRingtone: () => void;
  playCallingSound: () => void;
  stopCallingSound: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [lastActive, setLastActive] = useState<Record<string, number>>({});

  const location = useLocation();
  
  const notificationSound = useRef(new Audio('/assets/sounds/notification.mp3'));
  const ringtone = useRef(new Audio('/assets/sounds/ringtone.mp3'));
  const callingSound = useRef(new Audio('/assets/sounds/calling.mp3'));

  const playNotificationSound = useCallback(() => {
    if (notificationSound.current) {
      notificationSound.current.currentTime = 0; 
      notificationSound.current.play().catch(() => {});
    }
  }, []);

  const playRingtone = useCallback(() => {
    if (ringtone.current) {
      ringtone.current.loop = true; 
      ringtone.current.play().catch(err => console.warn("🔇 Ringtone blocked:", err));
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtone.current) {
      ringtone.current.pause();
      ringtone.current.currentTime = 0;
    }
  }, []);

  const playCallingSound = useCallback(() => {
    if (callingSound.current) {
      callingSound.current.loop = true; 
      callingSound.current.play().catch(err => console.warn("🔇 Calling sound blocked:", err));
    }
  }, []);

  const stopCallingSound = useCallback(() => {
    if (callingSound.current) {
      callingSound.current.pause();
      callingSound.current.currentTime = 0;
    }
  }, []);

  const emitEvent = useCallback((type: string, receiver: string, data: unknown) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ 
        type, 
        receiver: receiver.toLowerCase(), 
        data 
      }));
    }
  }, [socket]);

  const sendCallSignal = useCallback((receiver: string, type: string, signalData: unknown) => {
    emitEvent(type, receiver, signalData);
  }, [emitEvent]);

  const handleDistractionAlert = useCallback((data: DistractionAlert) => {
    playNotificationSound();
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-red-600 text-white shadow-2xl rounded-3xl pointer-events-auto flex flex-col overflow-hidden border-4 border-white/20 backdrop-blur-xl`}>
        {data.snapshot && (
          <div className="w-full h-40 bg-black">
            <img src={data.snapshot} alt="Distraction Snapshot" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl animate-bounce">⚠️</span>
            <h3 className="font-black uppercase tracking-tighter text-lg">Focus Alert!</h3>
          </div>
          <p className="text-sm font-medium opacity-90">
            <b>{data.child_name}</b> looks distracted: <span className="italic">{data.status}</span>
          </p>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/parent/monitoring';
            }}
            className="mt-4 w-full bg-white text-red-600 font-black py-3 rounded-2xl text-xs uppercase hover:bg-gray-100 transition-colors"
          >
            Check Monitoring Live
          </button>
        </div>
      </div>
    ), { duration: 8000, position: 'top-right' });
  }, [playNotificationSound]);

  const handleIncomingMessage = useCallback((msg: Message) => {
    playNotificationSound();
    setUnreadCount(prev => prev + 1);

    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-[2rem] pointer-events-auto flex border-l-4 border-purple-50`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5 text-2xl">💬</div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                New message from {msg.sender_email.split('@')[0]}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-medium">
                {msg.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-100 dark:border-gray-700">
          <button
            onClick={() => {
                toast.dismiss(t.id);
                const role = localStorage.getItem('role');
                window.location.href = role === 'parent' ? '/parent/chat' : '/chat';
            }}
            className="w-full border border-transparent rounded-none rounded-r-[2rem] px-6 py-4 flex items-center justify-center text-xs font-black text-purple-600 hover:text-purple-500 focus:outline-none"
          >
            OPEN
          </button>
        </div>
      </div>
    ), { duration: 5000 });
  }, [playNotificationSound]);

  useEffect(() => {
    const userEmail = localStorage.getItem('userEmail')?.toLowerCase(); 
    const token = localStorage.getItem('token');

    if (!token || !userEmail) {
        if (socket) { socket.close(); setSocket(null); }
        setIsConnected(false);
        return;
    }

    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

    const baseWsUrl = import.meta.env.VITE_WS_URL;
    const wsUrl = `${baseWsUrl}/chat-system/ws/${encodeURIComponent(userEmail)}?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => { 
      console.log("✅ Socket connected");
      setIsConnected(true); 
      setSocket(ws); 
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentMe = localStorage.getItem('userEmail')?.toLowerCase();
        
        if (data.sender_email) {
          setLastActive(prev => ({
            ...prev,
            [data.sender_email.toLowerCase()]: Date.now()
          }));
        }

        if (data.message && data.sender_email && data.sender_email.toLowerCase() !== currentMe) {
            if (!window.location.pathname.includes('chat')) handleIncomingMessage(data);
            else playNotificationSound();
        }

        if (data.type === 'distraction_alert') {
          handleDistractionAlert(data.data);
        }
        
        if (data.type && data.sender_email && data.sender_email.toLowerCase() !== currentMe) {
            if (data.type === 'call_request') {
                setIncomingCall({
                    sender_email: data.sender_email,
                    type: data.data?.mode || 'video', 
                    signal_data: data.data 
                });
                playRingtone(); 
                sendCallSignal(data.sender_email, 'receiver_ringing', {});
            }
            
            if (data.type === 'end_call' || data.type === 'call_rejected') {
                setIncomingCall(null);
                stopRingtone();
                stopCallingSound();
            }
        }
      } catch (error) { console.error("❌ Socket error:", error); }
    };

    ws.onclose = () => { 
      setIsConnected(false); 
      setSocket(null); 
    };
    
    ws.onerror = (err) => console.error("❌ WebSocket Error:", err);
    
    return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
    // ✅ تم حل مشكلة الـ Dependencies بإضافة كافة الدوال المطلوبة
  }, [
    location.pathname, 
    socket, 
    handleDistractionAlert, 
    handleIncomingMessage, 
    playNotificationSound, 
    playRingtone, 
    sendCallSignal, 
    stopCallingSound, 
    stopRingtone
  ]); 

  const sendMessage = useCallback((receiver: string, msg: string) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ receiver: receiver.toLowerCase(), msg }));
    }
  }, [socket]);

  return (
    <SocketContext.Provider value={{ 
      socket, isConnected, lastActive, sendMessage, sendCallSignal, emitEvent,
      unreadCount, setUnreadCount, incomingCall, setIncomingCall,
      stopRingtone, playCallingSound, stopCallingSound 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ تم حل مشكلة الـ Fast Refresh بإضافة الـ Ignore Comment
// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};