import { motion } from 'framer-motion';
import { Phone, Video } from 'lucide-react';

interface CallActionButtonsProps {
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  disabled?: boolean;
}

export default function CallActionButtons({ 
  onStartVoiceCall, 
  onStartVideoCall, 
  disabled 
}: CallActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Voice Call Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStartVoiceCall}
        disabled={disabled}
        className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-2xl glass 
                   bg-gray-100/50 dark:bg-white/10 
                   border border-gray-200 dark:border-white/20 
                   backdrop-blur-md 
                   text-gray-700 dark:text-white/80 
                   hover:text-purple-600 dark:hover:text-white 
                   hover:border-purple-300 dark:hover:border-purple-500/50
                   transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
        title="Voice Call"
      >
        <Phone size={18} className="group-hover:animate-pulse z-10" />
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>

      {/* Video Call Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStartVideoCall}
        disabled={disabled}
        className="w-11 h-11 md:w-12 md:h-12 flex items-center justify-center rounded-2xl glass 
                   bg-gray-100/50 dark:bg-white/10 
                   border border-gray-200 dark:border-white/20 
                   backdrop-blur-md 
                   text-gray-700 dark:text-white/80 
                   hover:text-pink-600 dark:hover:text-white 
                   hover:border-pink-300 dark:hover:border-pink-500/50
                   transition-all disabled:opacity-30 disabled:cursor-not-allowed group relative"
        title="Video Call"
      >
        <Video size={18} className="group-hover:animate-pulse z-10" />
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 rounded-2xl bg-pink-500/10 dark:bg-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.button>
    </div>
  );
}