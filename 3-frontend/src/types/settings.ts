export type ThemeOption = 'light' | 'dark' | 'auto';

export interface NotificationsState {
  distractions: boolean;
  tasks: boolean;
  achievements: boolean;
  weeklyReport: boolean;
}

export interface SettingsData {
  theme: ThemeOption;
  focus_sensitivity: number;
  notifications: NotificationsState;
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: string;
  avatar: string;
  is_active: boolean;
  parent_email: string; // ✅ إضافة حقل إيميل الوالد للربط مع السوكيت
  _id?: string;
}

export interface RawChildProfile {
  _id?: string;
  id?: string;
  name: string;
  grade: string;
  avatar: string;
  is_active: boolean;
  parent_email: string; // ✅ التحديث هنا كمان لضمان الـ Mapping الصحيح من الـ API
}