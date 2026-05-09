import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { useSocket } from '../../../contexts/SocketContext';

interface IncomingCallModalProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallModal({ onAccept, onReject }: IncomingCallModalProps) {
  const { incomingCall } = useSocket();

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      {/* Container - Centered for all screens */}
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          className="w-full max-w-[320px] sm:max-w-sm bg-white/10 dark:bg-gray-900/40 border border-white/20 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-8 shadow-2xl text-center"
        >
          {/* Avatar Area with pulse effect */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full animate-ping opacity-20" />
            <div className="relative w-full h-full bg-white/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl border border-white/30 shadow-inner">
              {incomingCall.type === 'video' ? '📹' : '📞'}
            </div>
          </div>

          {/* Caller Info */}
          <div className="mb-8">
            <h3 className="text-lg sm:text-xl font-black text-white mb-1 uppercase tracking-tighter">
              Incoming Call
            </h3>
            <p className="text-white/60 font-medium text-sm sm:text-base lowercase truncate px-4">
              {incomingCall.sender_email.split('@')[0]}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            {/* Reject Button */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onReject}
                className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-lg transition-all shadow-red-500/40"
              >
                <PhoneOff className="w-6 h-6 sm:w-7 sm:h-7" />
              </motion.button>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Decline</span>
            </div>

            {/* Accept Button */}
            <div className="flex flex-col items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAccept}
                className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-green-500/90 hover:bg-green-600 text-white rounded-full shadow-lg transition-all shadow-green-500/40"
              >
                {incomingCall.type === 'video' ? (
                  <Video className="w-6 h-6 sm:w-7 sm:h-7" />
                ) : (
                  <Phone className="w-6 h-6 sm:w-7 sm:h-7" />
                )}
              </motion.button>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Accept</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}