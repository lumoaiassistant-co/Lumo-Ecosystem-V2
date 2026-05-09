import { ChildProfile, CreateChildData } from '../types/parent';

// ✅ تعريف الأنواع الجديدة لمنع استخدام 'any' وإرضاء الـ ESLint
export interface VisionLog {
  id: string;
  timestamp: string;
  status: string;
  snapshot?: string;
}

export interface FocusStat {
  time: string;
  focus: number;
}

// ✅ التعديل: القراءة من ملف الـ .env لضمان المرونة في الشبكة
const API_BASE = `${import.meta.env.VITE_API_URL}/parent`;

const getHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json"
});

export const parentService = {
  // 1. جلب قائمة الأطفال التابعين لهذا الأب
  async getChildren(): Promise<ChildProfile[]> {
    const res = await fetch(`${API_BASE}/children`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch children list");
    return res.json();
  },

  // 2. إضافة طفل جديد
  async addChild(data: CreateChildData): Promise<ChildProfile> {
    const res = await fetch(`${API_BASE}/children`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("Could not add child profile");
    return res.json();
  },

  // 3. تحديث بيانات طفل
  async updateChild(childId: string, data: Partial<CreateChildData>): Promise<boolean> {
    const res = await fetch(`${API_BASE}/children/${childId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  // 4. حذف بروفايل طفل
  async deleteChild(childId: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/children/${childId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  },

  // ✅ 5. جلب سجلات التشتت (Vision Logs) الخاصة بطفل معين
  async getVisionLogs(childId: string): Promise<VisionLog[]> {
    const res = await fetch(`${API_BASE}/vision-logs/${childId}`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error("Failed to fetch vision logs");
    return res.json();
  },

  // ✅ 6. جلب إحصائيات التركيز للرسم البياني
  async getFocusStats(childId: string): Promise<FocusStat[]> {
    const res = await fetch(`${API_BASE}/focus-stats/${childId}`, { 
      headers: getHeaders() 
    });
    if (!res.ok) throw new Error("Failed to fetch focus stats");
    return res.json();
  }
};