import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState } from "react"; // ✅ تم حذف useRef الزائدة لإرضاء ESLint
import { Loader2, Mail, Lock, Calendar, ShieldCheck, Users } from "lucide-react";
import { authService } from "../../services/authService";

// تعريف شكل الداتا
interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  role: string;
  acceptPolicy: boolean;
  parentEmail?: string;
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface AxiosErrorResponse {
  response?: {
    data?: {
      detail?: string | ValidationError[] | { msg: string };
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

export default function Signup() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    age: 10,
    role: "child",
    parentEmail: "", 
  });

  const [acceptPolicy, setAcceptPolicy] = useState(false);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === "age" ? parseInt(value) || 0 : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!acceptPolicy) {
      setError("Please accept the Privacy Policy to continue.");
      return;
    }

    if (formData.role === "child" && !formData.parentEmail) {
      setError("Parent email is required for students.");
      return;
    }

    try {
      setIsLoading(true);

      const signupPayload: SignupPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        role: formData.role,
        acceptPolicy: acceptPolicy
      };

      if (formData.role === "child") {
        signupPayload.parentEmail = formData.parentEmail;
      }

      await authService.signup(signupPayload);
      navigate("/login");
    } catch (err: unknown) {
      const errorData = err as AxiosErrorResponse;
      const detail = errorData.response?.data?.detail;

      if (detail) {
        if (Array.isArray(detail)) {
          setError(`${detail[0].loc[detail[0].loc.length - 1]}: ${detail[0].msg}`);
        } else if (typeof detail === 'object' && 'msg' in detail) {
           setError(detail.msg);
        } else {
          setError(detail as string);
        }
      } else {
        setError(errorData.message || "An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-2xl bg-white/70 border border-gray-100 outline-none shadow-sm focus:ring-2 focus:ring-purple-400 transition-all text-gray-800 font-medium placeholder:text-gray-400";

  return (
    <motion.div 
      variants={bgVariants}
      animate="animate"
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden p-4 md:p-8"
    >
      {/* === Dynamic background shapes === */}
      <FloatingShape delay={0} x="5%" y="15%" size={150} color="bg-purple-300" />
      <FloatingShape delay={2} x="85%" y="35%" size={180} color="bg-pink-300" />
      <FloatingShape delay={4} x="10%" y="75%" size={160} color="bg-blue-300" />

      <div className="relative z-10 flex flex-col md:flex-row-reverse items-center justify-between w-full max-w-7xl gap-10 lg:gap-12">
        <motion.div 
          initial={{ x: 50, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          className="w-full md:w-[480px] lg:w-[520px] bg-white/40 backdrop-blur-2xl p-6 md:p-8 rounded-[2.5rem] shadow-2xl border border-white/40"
        >
          <div className="text-center mb-8">
            <h1 
              className="text-4xl font-black leading-tight mb-2"
              style={{
                background: "linear-gradient(135deg, #A78BFA 0%, #F472B6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Join Lumo
            </h1>
            <p className="text-gray-600 text-sm font-medium">Start your personalized learning journey today</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs border border-red-100 font-bold">
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">First Name</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                  className={inputClasses} placeholder="First Name" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Last Name</label>
                <input type="text" name="lastName" required value={formData.lastName} onChange={handleChange}
                  className={inputClasses} placeholder="Last Name" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                  className={`${inputClasses} pl-11`} placeholder="name@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="password" name="password" required value={formData.password} onChange={handleChange}
                      className={`${inputClasses} pl-11`} placeholder="••••••••" />
                  </div>
               </div>
               
               <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">Age</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="number" name="age" required value={formData.age} onChange={handleChange}
                      className={`${inputClasses} pl-11`} />
                  </div>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wider">I am a...</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/70 border border-gray-100 focus:ring-2 focus:ring-purple-400 outline-none transition-all shadow-sm appearance-none cursor-pointer text-sm text-gray-800 font-medium"
                >
                  <option value="child">Child / Student</option>
                  <option value="parent">Parent / Teacher</option>
                </select>
              </div>
            </div>

            <AnimatePresence>
              {formData.role === "child" && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="text-xs font-bold text-purple-600 ml-1 uppercase tracking-wider">Parent's Email Address</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input 
                      type="email" 
                      name="parentEmail" 
                      required 
                      value={formData.parentEmail} 
                      onChange={handleChange}
                      className={`${inputClasses} pl-11 border-purple-100 bg-purple-50/30`} 
                      placeholder="Your parent's account email" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <label className="flex items-center gap-3 cursor-pointer group mt-2">
              <input type="checkbox" checked={acceptPolicy} onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="w-5 h-5 rounded-lg border-gray-300 text-purple-600 focus:ring-purple-400" />
              <span className="text-xs text-gray-600 font-medium">I agree to the <span className="font-bold underline text-gray-800">Privacy Policy</span></span>
            </label>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-purple-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 3 }}
                style={{ pointerEvents: "none" }}
              />
              <span className="relative flex items-center gap-2">
                {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
              </span>
            </button>
          </form>

          <p className="text-center text-gray-500 mt-6 text-sm font-medium">
            Already have an account?{" "}
            <button onClick={() => navigate("/login")} className="text-purple-600 font-black hover:underline">Log In</button>
          </p>
        </motion.div>

        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="hidden md:flex flex-1 justify-center items-center"
        >
          <motion.img 
            src="assets/lumo-3d-hero.png" 
            alt="Lumo AI" 
            className="w-[500px] lg:w-[600px] drop-shadow-2xl" 
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}