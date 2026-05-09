export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  role?: 'parent' | 'child';
}

export interface FocusData {
  day: string;
  focus: number;
  distractions: number;
}

export interface BehaviorData {
  subject: string;
  value: number;
}

export interface Notification {
  id: number | string;
  type: string;
  message: string;
  time: string;
  severity: string;
}

export interface DashboardStats {
  focus_data: FocusData[];
  behavior_data: BehaviorData[];
  notifications: Notification[];
  
  // === 🚀 نظام الـ Level و الـ XP ===
  current_level: number;
  current_xp: number;
  xp_to_next_level: number;
  total_tasks_completed?: number;
}

// الواجهة النظيفة للـ Components
export interface Task {
  id: string;
  title: string;
  subject: string;
  duration: string;
  color: string;
  day: string;
  is_completed: boolean;
  // أضفنا ده عشان نعرف مين اللي أنشأ المهمة (الأب أم الطفل)
  created_by?: 'parent' | 'child'; 
}

// الداتا الخام من قاعدة البيانات (MongoDB)
export interface RawTask {
  id?: string;
  _id?: string;
  title: string;
  subject: string;
  duration: string;
  color: string;
  day: string;
  is_completed: boolean;
  // التحديث هنا كمان عشان الـ Mapping يشتغل صح
  created_by?: 'parent' | 'child';
}

// ✅ إضافة: واجهة نتائج نظام الرؤية الحاسوبية (YOLOv8)
// دي اللي هتخلي الـ FocusGuard والـ VisionService "Type-Safe"
export interface VisionResult {
  status: string;
  is_distracted: boolean;
  child_id?: string;
  timestamp?: string;
}