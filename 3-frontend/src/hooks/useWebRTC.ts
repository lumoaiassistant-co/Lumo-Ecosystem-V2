import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { chatService } from '../services/chatService';

interface IncomingCallSignal {
  mode: 'voice' | 'video';
  sdp: RTCSessionDescriptionInit;
}

export const useWebRTC = (receiverEmail: string) => {
  const { 
    socket, 
    sendCallSignal, 
    stopRingtone, 
    playCallingSound, 
    stopCallingSound 
  } = useSocket(); 

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const callStartTime = useRef<number | null>(null);
  const isInitiator = useRef(false);

  const logCallToChat = useCallback((status: string) => {
    if (!receiverEmail) return;
    const duration = callStartTime.current ? Math.round((Date.now() - callStartTime.current) / 1000) : 0;
    const role = isInitiator.current ? 'caller' : 'receiver';
    const logMsg = `CALL_LOG:${status}:${duration}:${role}`;
    
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ receiver: receiverEmail.toLowerCase(), msg: logMsg }));
    }
  }, [receiverEmail, socket]);

  const endCall = useCallback((isRejected = false) => {
    // إيقاف جميع مسارات الصوت والفيديو فوراً
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    stopRingtone();
    stopCallingSound();

    // تسجيل اللوج بناءً على حالة المكالمة قبل الإغلاق
    if (callStatus === 'connected') {
        logCallToChat('completed');
    } else if (isInitiator.current && (callStatus === 'calling' || callStatus === 'ringing')) {
        logCallToChat(isRejected ? 'declined' : 'missed');
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallStatus('ended');

    if (receiverEmail) {
      sendCallSignal(receiverEmail.toLowerCase(), isRejected ? 'call_rejected' : 'end_call', {});
    }

    setTimeout(() => {
        setCallStatus('idle');
        isInitiator.current = false;
    }, 2000);
    
    callStartTime.current = null;
  }, [localStream, receiverEmail, sendCallSignal, stopRingtone, stopCallingSound, callStatus, logCallToChat]);

  const initPeerConnection = useCallback(async () => {
    const token = localStorage.getItem('token') || "";
    try {
      const { iceServers } = await chatService.getIceServers(token);
      peerConnection.current = new RTCPeerConnection({ iceServers });

      peerConnection.current.ontrack = (event) => {
        console.log("🎬 Remote track received");
        setRemoteStream(event.streams[0]);
        setCallStatus('connected');
        stopCallingSound();
        if (!callStartTime.current) callStartTime.current = Date.now();
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && receiverEmail) {
          sendCallSignal(receiverEmail.toLowerCase(), 'ice_candidate', event.candidate);
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current?.connectionState;
        console.log("📡 Connection State:", state);
        if (state === 'failed' || state === 'disconnected') endCall();
      };
    } catch (err) {
      console.error("❌ RTC Init Error:", err);
    }
  }, [receiverEmail, sendCallSignal, endCall, stopCallingSound]);

  const startCall = async (mode: 'voice' | 'video') => {
    try {
      isInitiator.current = true;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: mode === 'video',
        audio: true
      });
      setLocalStream(stream);
      setCallStatus('calling');
      playCallingSound();

      await initPeerConnection();
      
      stream.getTracks().forEach(track => {
        if (peerConnection.current) peerConnection.current.addTrack(track, stream);
      });

      const offer = await peerConnection.current?.createOffer();
      if (offer) {
        await peerConnection.current?.setLocalDescription(offer);
        sendCallSignal(receiverEmail.toLowerCase(), 'call_request', { sdp: offer, mode });
      }
    } catch (err) {
      console.error("❌ Media Access Error:", err);
      setCallStatus('idle');
      stopCallingSound();
      isInitiator.current = false;
    }
  };

  const answerCall = async (incomingSignal: IncomingCallSignal, callerEmail?: string) => {
    try {
      const target = (callerEmail || receiverEmail)?.toLowerCase();
      if (!target) return;

      isInitiator.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: incomingSignal.mode === 'video',
        audio: true
      });
      setLocalStream(stream);
      stopRingtone();

      await initPeerConnection();

      stream.getTracks().forEach(track => {
        if (peerConnection.current) peerConnection.current.addTrack(track, stream);
      });

      await peerConnection.current?.setRemoteDescription(new RTCSessionDescription(incomingSignal.sdp));
      const answer = await peerConnection.current?.createAnswer();
      if (answer) {
        await peerConnection.current?.setLocalDescription(answer);
        sendCallSignal(target, 'answer', answer);
        setCallStatus('connected');
        if (!callStartTime.current) callStartTime.current = Date.now();
      }
    } catch (err) {
      console.error("❌ Answer Call Error:", err);
      endCall();
    }
  };

  useEffect(() => {
    if (!socket || !receiverEmail) return;

    const handleSignaling = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender_email?.toLowerCase() !== receiverEmail.toLowerCase()) return;

        const signal = data.data;

        switch (data.type) {
          case 'receiver_ringing':
            if (callStatus === 'calling') setCallStatus('ringing');
            break;
          case 'answer':
            console.log("✅ Answer received, establishing connection...");
            peerConnection.current?.setRemoteDescription(new RTCSessionDescription(signal))
              .catch(e => console.error("SDP Error:", e));
            setCallStatus('connected');
            stopCallingSound();
            break;
          case 'ice_candidate':
            if (signal) {
                peerConnection.current?.addIceCandidate(new RTCIceCandidate(signal))
                  .catch(e => console.error("ICE Error:", e));
            }
            break;
          case 'call_rejected':
            console.log("🚫 Call rejected by peer");
            endCall(true);
            break;
          case 'end_call':
            console.log("🛑 Call ended by peer");
            endCall();
            break;
        }
      } catch (err) { console.error("❌ Signaling error:", err); }
    };

    socket.addEventListener('message', handleSignaling);
    return () => socket.removeEventListener('message', handleSignaling);
  }, [socket, receiverEmail, endCall, callStatus, stopCallingSound]);

  return { localStream, remoteStream, callStatus, startCall, answerCall, endCall };
};