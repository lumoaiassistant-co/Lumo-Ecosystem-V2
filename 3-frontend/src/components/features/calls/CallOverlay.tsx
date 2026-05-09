import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Loader2 } from 'lucide-react';

interface CallOverlayProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  mode: 'voice' | 'video';
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
}

export default function CallOverlay({ 
  localStream, 
  remoteStream, 
  onEndCall, 
  mode,
  callStatus 
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  // ربط الـ Streams بالـ Video Elements
  useEffect(() => {
    if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [localStream, remoteStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && mode === 'video') {
      localStream.getVideoTracks()[0].enabled = isVideoOff;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col items-center justify-center overflow-hidden font-display transition-colors duration-500"
    >
      {/* Remote Video or Audio Placeholder Background */}
      <div className="absolute inset-0 z-0">
        {mode === 'video' && remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          /* ✅ تدرج ألوان متكيف مع الثيم */
          <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-white dark:from-gray-900 dark:via-purple-950 dark:to-black flex items-center justify-center transition-all duration-500">
            {/* Animated Ripples when Ringing/Calling */}
            {(callStatus === 'calling' || callStatus === 'ringing') && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.5, 2], opacity: [0.3, 0.1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute w-64 h-64 border border-purple-400 dark:border-purple-500 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.8, 2.5], opacity: [0.2, 0.05, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  className="absolute w-64 h-64 border border-indigo-400 dark:border-indigo-500 rounded-full"
                />
              </div>
            )}
            
            {/* Placeholder Avatar */}
            <motion.div 
              animate={callStatus === 'ringing' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="relative w-40 h-40 bg-white dark:bg-white/10 rounded-full flex items-center justify-center border border-purple-100 dark:border-white/20 backdrop-blur-xl shadow-2xl"
            >
              <span className="text-7xl">👤</span>
            </motion.div>
          </div>
        )}
        {/* Overlay Blur (أخف في الـ Light Mode) */}
        <div className="absolute inset-0 bg-white/10 dark:bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* ✅ Central Status Indicator */}
      <AnimatePresence>
        {(callStatus === 'calling' || callStatus === 'ringing') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-20 flex flex-col items-center gap-4 mt-8"
          >
            <div className="flex items-center gap-3 bg-white/80 dark:bg-white/10 px-8 py-3 rounded-full border border-purple-100 dark:border-white/20 backdrop-blur-3xl shadow-xl">
              {callStatus === 'calling' ? (
                <Loader2 className="animate-spin text-purple-600 dark:text-purple-400" size={24} />
              ) : (
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]" />
              )}
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest italic">
                {callStatus === 'calling' ? "Calling..." : "Ringing..."}
              </h2>
            </div>
            <p className="text-gray-500 dark:text-white/60 font-medium text-sm tracking-tighter uppercase">
              Connecting to Lumo Secure Tunnel
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Top Badge */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 text-center w-full px-4">
        <motion.div 
          className="inline-block glass bg-white/80 dark:bg-white/5 border border-purple-50 dark:border-white/10 backdrop-blur-2xl px-6 py-2 rounded-full shadow-lg"
        >
          <div className="flex items-center justify-center gap-3">
            <ShieldCheck size={14} className={callStatus === 'connected' ? "text-green-500 dark:text-green-400" : "text-gray-400 dark:text-white/40"} />
            <span className="text-[10px] text-gray-700 dark:text-white/80 font-black uppercase tracking-widest">
              {callStatus === 'connected' ? "Secure - End to End" : "Signaling..."}
            </span>
            {callStatus === 'connected' && (
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            )}
          </div>
        </motion.div>
      </div>

      {/* Local Video (PiP) */}
      {mode === 'video' && (
        <motion.div
          drag
          dragConstraints={{ left: -200, right: 200, top: -300, bottom: 300 }}
          className="absolute top-8 right-8 z-20 w-32 h-48 md:w-40 md:h-56 glass bg-white border border-purple-100 dark:bg-white/10 dark:border-white/20 rounded-[2rem] overflow-hidden shadow-2xl cursor-move"
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-900/80 backdrop-blur-md flex items-center justify-center">
              <VideoOff className="text-gray-400 dark:text-white/40" />
            </div>
          )}
        </motion.div>
      )}

      {/* Controls Bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-12 z-30 flex items-center gap-4 md:gap-6 px-6 py-4 glass bg-white/90 dark:bg-black/40 border border-gray-200 dark:border-white/20 backdrop-blur-2xl rounded-[3rem] shadow-2xl"
      >
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
          }`}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {mode === 'video' && (
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all ${
              isVideoOff ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={onEndCall}
          className="w-12 h-12 md:w-14 md:h-14 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-600/40 transition-all hover:scale-110 active:scale-95"
        >
          <PhoneOff size={22} />
        </button>
      </motion.div>
    </motion.div>
  );
}