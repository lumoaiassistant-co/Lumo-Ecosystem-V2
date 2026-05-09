// 1. تعريف الأوسمة
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked_at: string;
}

// 2. تعريف الإحصائيات العامة
export interface UserStats {
  current_xp: number;
  current_level: number;
  badges: Badge[];
  xp_to_next_level: number;
}

// ✅ 3. تعريف الرد الخاص بعملية منح الـ XP (عشان نسكت الـ Linter)
export interface AwardXpResponse {
  status: string;
  xp_added: number;
  current_total_xp: number;
  level_up: boolean;
  new_level: number;
  new_badges: string[];
}

// ✅ التعديل: القراءة من ملف الـ .env لضمان المرونة في الشبكة
const API_BASE = `${import.meta.env.VITE_API_URL}/game`;

const getHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem("token")}`,
  "Content-Type": "application/json"
});

export const gamificationService = {
  /**
   * جلب إحصائيات الجيميفيكيشن الحالية لطفل معين
   */
  async getStats(childId: string): Promise<UserStats> {
    const res = await fetch(`${API_BASE}/stats?child_id=${childId}`, {
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to load achievement stats");
    }
    return res.json();
  },

  /**
   * منح XP يدوياً (تم تغيير any لنوع البيانات المظبوط ✅)
   */
  async awardXp(childId: string, amount: number, reason: string): Promise<AwardXpResponse> {
    const res = await fetch(`${API_BASE}/award?child_id=${childId}&amount=${amount}&reason=${reason}`, {
      method: 'POST',
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to award XP");
    }
    return res.json();
  }
};