export interface UserProfile {
  id: string;
  email: string;
  firstName: string; // تحديث
  lastName: string;  // تحديث
  age: number;       // إضافة
  role: 'parent' | 'child';
  has_pin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface LoginCredentials {
  email: string;
  password?: string; // أو حسب الـ API بتاعك
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;   // تحديث
  lastName: string;    // تحديث
  age: number;         // إضافة
  acceptPolicy: boolean; // إضافة
}