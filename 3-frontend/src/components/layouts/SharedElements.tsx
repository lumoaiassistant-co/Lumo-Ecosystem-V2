import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const FloatingBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: 0, opacity: 0.3 }}
        animate={{ y: [-20, 20, -20], opacity: [0.3, 0.6, 0.3], rotate: [0, 360] }}
        transition={{ duration: 6 + i * 0.5, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
        className="absolute w-20 h-20 text-lavender-300 dark:text-lavender-700"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
      >
        <Sparkles className="w-full h-full" />
      </motion.div>
    ))}
  </div>
);