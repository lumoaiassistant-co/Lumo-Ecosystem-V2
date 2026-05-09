/**
 * تمثيل بروفايل الطفل بالكامل
 * تم إضافة is_active ليتوافق مع الـ ChildContext
 */
export interface ChildProfile {
  id: string;          // الـ ID الفريد (MongoDB _id)
  name: string;        // اسم الطفل
  age: number;         // عمر الطفل
  grade: string;       // السنة الدراسية
  avatar: string;      // الأفاتار المختار
  total_xp: number;    // مجموع نقاط الخبرة
  level: number;       // المستوى الحالي
  is_active: boolean;  // هل هذا البروفايل هو النشط حالياً؟ (مهم جداً للـ Context)
  created_at?: string; // تاريخ الإنشاء
}

/**
 * البيانات المطلوبة لإنشاء بروفايل جديد
 */
export interface CreateChildData {
  name: string;
  age: number;
  grade: string;
  avatar: string;
}

/**
 * استخدام type بدل interface لتجنب خطأ @typescript-eslint/no-empty-object-type
 */
export type UpdateChildData = Partial<CreateChildData>;

/**
 * ملخص إحصائيات لوحة تحكم الأب
 */
export interface ParentSummary {
  total_children: number;
  total_assigned_quizzes: number;
  average_progress: number;
  recent_activities: ParentActivity[];
}

/**
 * سجل النشاطات للأطفال
 */
export interface ParentActivity {
  id: string;
  child_name: string;
  action: string;      // مثلاً: "Completed a Quiz"
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}