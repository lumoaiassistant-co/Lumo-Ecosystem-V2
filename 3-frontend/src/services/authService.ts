import { LoginCredentials, SignupData, AuthResponse, UserProfile } from '../types/auth';

// ✅ التعديل: القراءة من ملف الـ .env لضمان العمل على الموبايل والشبكة
const API_BASE = `${import.meta.env.VITE_API_URL}/auth`;

export const authService = {
  // 1. تسجيل الدخول
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error((data as { detail?: string }).detail || "Login failed");
    }
    
    const authData = data as AuthResponse;
    
    if (authData.access_token && authData.user) {
        localStorage.setItem("token", authData.access_token);
        localStorage.setItem("userEmail", authData.user.email.toLowerCase()); 
        
        const role = (authData.user.role || "child").toLowerCase();
        localStorage.setItem("role", role);

        // ✅ التعديل القاتل (محفوظ كما هو):
        // الباك إند بيبعتها "parentEmail" (بسبب الـ Alias في Pydantic)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parentEmail = (authData.user as any).parentEmail || (authData.user as any).parent_email;

        if (role === 'child' && parentEmail) {
            localStorage.setItem("parentEmail", parentEmail.toLowerCase());
            console.log("✅ Parent Email Saved:", parentEmail);
        } else {
            console.warn("⚠️ Parent Email not found in response!");
        }
    }
    
    return authData.user;
  },

  // 2. إنشاء حساب جديد
  async signup(userData: SignupData): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    const data = await res.json();
    
    if (!res.ok) {
        throw new Error((data as { detail?: string }).detail || "Signup failed");
    }
    
    return data as AuthResponse;
  }
};