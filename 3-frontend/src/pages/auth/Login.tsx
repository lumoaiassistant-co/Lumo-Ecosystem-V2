import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { authService } from "../../services/authService";

// تعريف الأخطاء
interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string | ValidationError[];
    };
  };
  message?: string;
}

// === Floating background shapes component ===
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

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  // Background animation variants
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const user = await authService.login(formData);
      const role = (user?.role || "child").toLowerCase();
      
      if (role === 'parent') {
        navigate("/parent/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const errorData = err as AxiosErrorResponse;
      if (errorData.response?.data?.detail) {
        const detail = errorData.response.data.detail;
        if (Array.isArray(detail)) {
          setError(`${detail[0].loc[1]}: ${detail[0].msg}`);
        } else {
          setError(detail);
        }
      } else {
        setError(errorData.message || "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-4 rounded-2xl bg-white/70 border border-gray-100 focus:ring-2 focus:ring-purple-400 outline-none transition-all shadow-sm text-gray-800 font-medium placeholder:text-gray-400";

  return (
    <motion.div
      variants={bgVariants}
      animate="animate"
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 md:p-8"
    >
      {/* === Dynamic background shapes === */}
      <FloatingShape delay={0} x="10%" y="10%" size={150} color="bg-purple-300" />
      <FloatingShape delay={2} x="80%" y="20%" size={180} color="bg-pink-300" />
      <FloatingShape delay={4} x="5%" y="70%" size={160} color="bg-blue-300" />

      <div className="relative z-10 flex flex-col md:flex-row-reverse items-center justify-between w-full max-w-7xl gap-10 lg:gap-12">
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-full md:w-[480px] lg:w-[520px] bg-white/40 backdrop-blur-2xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl border border-white/40"
        >
          <div className="text-center mb-8">
            <motion.div
              className="mx-auto bg-gradient-to-r from-purple-600 to-pink-500 w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6"
              animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <User className="w-8 h-8" />
            </motion.div>
            
            {/* ✅ تم التعديل: عنوان بـ Gradient مطابق للـ Onboarding */}
            <h1 
              className="text-4xl font-black leading-tight mb-2"
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </h1>
            <p className="text-gray-600 mt-2 font-medium text-sm">Log in to continue your learning journey</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-100 flex items-center gap-2 font-bold">
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> Email Address
              </label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange} 
                placeholder="name@example.com" 
                className={inputClasses} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input 
                type="password" 
                name="password" 
                required 
                value={formData.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className={inputClasses} 
              />
            </div>

            {/* ✅ تم التعديل: زرار جرادينت مع تأثير اللمعة مطابق للـ Onboarding */}
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ pointerEvents: "none" }}
              />
              <span className="relative flex items-center gap-2">
                {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Logging in...</> : "Log In"}
              </span>
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8 text-sm font-medium">
            Don't have an account?{" "}
            <button onClick={() => navigate("/signup")} className="text-purple-600 font-black hover:underline">
              Sign Up
            </button>
          </p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="hidden md:flex flex-1 justify-center relative"
        >
          <motion.img 
            src="assets/lumo-3d-hero.png" 
            alt="Lumo 3D Hero" 
            className="w-[550px] lg:w-[650px] drop-shadow-[0_20px_50px_rgba(168,139,250,0.3)]" 
            animate={{ y: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}