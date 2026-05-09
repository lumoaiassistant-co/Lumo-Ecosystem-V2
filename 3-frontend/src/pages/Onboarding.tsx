import { motion, Variants, useMotionValue, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useRef } from "react";

export default function Onboarding() {
  const navigate = useNavigate();

  const bgVariants: Variants = {
    animate: {
      background: [
        "linear-gradient(135deg, #f5f3ff 0%, #fff0fb 100%)",
        "linear-gradient(135deg, #fff0fb 0%, #f5f3ff 100%)",
        "linear-gradient(135deg, #f0f9ff 0%, #f3e8ff 100%)",
      ],
      transition: { repeat: Infinity, duration: 18, ease: "easeInOut" },
    },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.25, delayChildren: 0.3 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const pulseVariants: Variants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
    },
  };

  const featureHover: Variants = {
    rest: { y: 0, scale: 1 },
    hover: { y: -4, scale: 1.03, transition: { type: "spring", stiffness: 180, damping: 14 } },
  };

  const features = [
    { icon: "🎯", label: "Smart Focus" },
    { icon: "📊", label: "Progress Tracking" },
    { icon: "🎨", label: "Interactive Learning" },
    { icon: "⭐", label: "Motivating Rewards" },
  ];

  // === 3D hover effect ===
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rotateX = useTransform(y, [0, 1], [12, -12]);
  const rotateY = useTransform(x, [0, 1], [-12, 12]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };
  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  // === Floating background shapes ===
  const FloatingShape = ({
    delay,
    x,
    y,
    size,
    color,
  }: {
    delay: number;
    x: string;
    y: string;
    size: number;
    color: string;
  }) => (
    <motion.div
      className={`absolute rounded-full ${color} opacity-30 blur-[40px] md:blur-[60px] pointer-events-none`}
      style={{ left: x, top: y, width: size, height: size }}
      animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
      transition={{
        delay,
        repeat: Infinity,
        duration: 8 + delay,
        ease: "easeInOut",
      }}
    />
  );

  return (
    <motion.div
      variants={bgVariants}
      animate="animate"
      className="min-h-screen w-full overflow-x-hidden flex items-center justify-center relative text-[1rem] md:text-[1.1rem] py-10 md:py-0"
    >
      {/* === Dynamic background shapes === */}
      <FloatingShape delay={0} x="5%" y="10%" size={120} color="bg-purple-300" />
      <FloatingShape delay={2} x="80%" y="30%" size={150} color="bg-pink-300" />
      <FloatingShape delay={4} x="5%" y="60%" size={140} color="bg-blue-300" />
      <FloatingShape delay={1} x="85%" y="5%" size={100} color="bg-purple-200" />

      {/* === Main content === */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8"
      >
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          {/* === 3D image === */}
          <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX, rotateY, perspective: 1000 }}
            variants={itemVariants}
            className="flex justify-center items-center relative order-1 md:order-1"
          >
            <div className="absolute inset-0 rounded-2xl blur-3xl opacity-30 bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 animate-pulse" />
            <motion.img
              src="assets/lumo-3d-hero.png"
              alt="3D futuristic AI learning interface"
              className="w-[200px] sm:w-[280px] md:w-[340px] lg:w-[400px] drop-shadow-2xl rounded-2xl pointer-events-none transition-transform duration-500"
              animate={{ y: [0, -10, 0], rotate: [0, 0.6, -0.6, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            />
          </motion.div>

          {/* === Text content === */}
          <motion.div variants={itemVariants} className="text-center md:text-left space-y-6 order-2 md:order-2">
            <div className="inline-flex items-center gap-2 mb-1 bg-white/40 px-3 py-1 rounded-full border border-white/60">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-purple-600 text-sm md:text-base">AI-Powered Learning</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1]"
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Meet Lumo
            </h1>

            <p className="text-gray-700 text-base md:text-xl font-medium max-w-md mx-auto md:mx-0 leading-relaxed">
              Your Child AI companion for smarter learning, better focus, and real progress — built for kids, loved by parents.
            </p>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white font-bold text-base px-10 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ pointerEvents: "none" }}
              />
              <span className="relative">Get Started Free</span>
            </motion.button>
          </motion.div>
        </div>

        {/* === FEATURES === */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-12 md:mt-20 mb-8"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              variants={featureHover}
              initial="rest"
              whileHover="hover"
              className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 text-center border border-white/50 hover:shadow-md transition-all duration-300"
            >
              <div className="text-2xl md:text-3xl mb-2">{feature.icon}</div>
              <p className="text-xs md:text-base font-bold text-gray-700 uppercase tracking-tight">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* === WHY LUMO === */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white/30 backdrop-blur-3xl rounded-[2rem] p-6 md:p-10 border border-white/50 shadow-2xl overflow-hidden"
        >
          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Why Lumo?</h2>
              <ul className="space-y-4">
                {[
                  "AI-personalized learning paths",
                  "Focus & progress insights",
                  "Gamified motivation",
                  "Parent-friendly dashboards",
                ].map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">✓</div>
                    <span className="text-gray-700 font-semibold text-sm md:text-base">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center bg-white/40 p-6 md:p-8 rounded-[1.5rem] border border-white/40 shadow-inner">
              <motion.div variants={pulseVariants} animate="animate" className="mb-4">
                <div className="text-5xl md:text-6xl">🚀</div>
              </motion.div>

              <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-4 text-center">
                Ready to transform?
              </h3>

              {/* ✅ تم التصليح: رجوع الـ Gradient للزرار السفلي كما كان في الأصل */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/signup")}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white font-bold text-base px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  style={{ pointerEvents: "none" }}
                />
                <span className="relative">Get Started Free</span>
              </motion.button>

              <p className="text-gray-500 text-[10px] md:text-xs text-center mt-4 font-medium">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}