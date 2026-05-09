import { Task, DashboardStats, UserProfile } from '../types/dashboard';

// ✅ التعديل: القراءة من .env (المتغير يحتوي بالفعل على /api/v1)
const API_BASE = import.meta.env.VITE_API_URL;

// هيدرز موحدة لسهولة التعديل
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

export const dashboardService = {
  
  // 1. جلب بيانات المستخدم (Profile)
  async getUserMe(): Promise<UserProfile> {
    const res = await fetch(`${API_BASE}/users/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Could not load user profile");
    return res.json();
  },

  // 2. جلب الإحصائيات (بما فيها الـ Level و الـ XP الحقيقيين)
  async getStats(childId?: string): Promise<DashboardStats> {
    const params = new URLSearchParams();
    if (childId) params.append('child_id', childId);

    const res = await fetch(`${API_BASE}/dashboard/stats?${params.toString()}`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error("Failed to sync dashboard stats");
    return res.json();
  },

  // 3. جلب جميع المهام (Planner)
  async getTasks(childId?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (childId) params.append('child_id', childId);

    const res = await fetch(`${API_BASE}/planner/?${params.toString()}`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error("Planner sync failed");
    return res.json();
  },

  // 4. إنشاء مهمة جديدة
  async createTask(taskData: Partial<Task>, childId?: string): Promise<boolean> {
    const params = new URLSearchParams();
    if (childId) params.append('child_id', childId);

    const res = await fetch(`${API_BASE}/planner/?${params.toString()}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    return res.ok;
  },

  // 5. تحديث حالة المهمة (PATCH)
  async updateTask(taskId: string, status?: boolean, day?: string): Promise<boolean> {
    const body: Partial<Task> = {};
    if (status !== undefined) body.is_completed = status;
    if (day) body.day = day;

    const res = await fetch(`${API_BASE}/planner/${taskId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    return res.ok;
  },

  // 6. مسح مهمة
  async deleteTask(taskId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/planner/${taskId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    return res.ok;
  }
};