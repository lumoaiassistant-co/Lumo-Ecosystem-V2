import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSocket } from './SocketContext';
import { useWebRTC } from '../hooks/useWebRTC';
import IncomingCallModal from '../components/features/calls/IncomingCallModal';
import CallOverlay from '../components/features/calls/CallOverlay';

// ✅ تعريف الأنواع بدقة لقتل الـ any
type WebRTCHookReturn = ReturnType<typeof useWebRTC>;

interface CallContextType {
  startCall: WebRTCHookReturn['startCall'];
  answerCall: WebRTCHookReturn['answerCall'];
  endCall: WebRTCHookReturn['endCall'];
  callStatus: WebRTCHookReturn['callStatus'];
  localStream: WebRTCHookReturn['localStream'];
  remoteStream: WebRTCHookReturn['remoteStream'];
  activePartner: string;
  setActivePartner: (email: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { incomingCall, setIncomingCall, stopRingtone } = useSocket();
  const [activePartner, setActivePartner] = useState<string>("");

  // استدعاء الهوك مرة واحدة فقط كـ Single Source of Truth
  const { 
    localStream, 
    remoteStream, 
    callStatus, 
    startCall, 
    answerCall, 
    endCall 
  } = useWebRTC(activePartner);

  // تحديث الشريك فور وصول مكالمة
  useEffect(() => {
    if (incomingCall?.sender_email) {
      setActivePartner(incomingCall.sender_email);
    }
  }, [incomingCall]);

  const handleAccept = async () => {
    if (incomingCall) {
      stopRingtone();
      const email = incomingCall.sender_email;
      // ✅ تمرير البيانات بدون any باستخدام النوع المشتق من الهوك
      const signalData = incomingCall.signal_data as Parameters<WebRTCHookReturn['answerCall']>[0];
      await answerCall(signalData, email);
      setIncomingCall(null);
    }
  };

  const handleReject = () => {
    stopRingtone();
    endCall(true); // إرسال رفض للطرف الآخر
    setIncomingCall(null);
    setActivePartner("");
  };

  return (
    <CallContext.Provider value={{ 
      startCall, answerCall, endCall, callStatus, 
      localStream, remoteStream, activePartner, setActivePartner 
    }}>
      {children}
      
      {/* عرض مودال المكالمة الواردة عالمياً */}
      {incomingCall && (
        <IncomingCallModal onAccept={handleAccept} onReject={handleReject} />
      )}

      {/* عرض واجهة المكالمة (Overlay) عالمياً */}
      {(callStatus !== 'idle' && callStatus !== 'ended') && (
        <CallOverlay 
          localStream={localStream}
          remoteStream={remoteStream}
          onEndCall={endCall}
          mode="video" 
          callStatus={callStatus}
        />
      )}
    </CallContext.Provider>
  );
};

// ✅ حل مشكلة Fast Refresh بإضافة الـ Ignore Comment
// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error('useCall must be used within CallProvider');
  return context;
};