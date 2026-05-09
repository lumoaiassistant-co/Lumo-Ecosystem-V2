import { Quiz, QuizSubmission, Question, QuizGenerateRequest, PinStatus } from '../types/quiz';

// ✅ التعديل: القراءة من .env لضمان العمل في الجامعة وعلى الموبايل
const BASE_URL = import.meta.env.VITE_API_URL;
const QUIZ_API = `${BASE_URL}/quizzes`;
const USER_API = `${BASE_URL}/users`;

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const quizService = {
  // 1. جلب الكويزات الخاصة بطفل معين
  async getQuizzes(childId: string): Promise<Quiz[]> {
    const res = await fetch(`${QUIZ_API}/?child_id=${childId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch quizzes");
    return res.json();
  },

  // 2. تسليم إجابات الكويز
  async submitQuiz(quizId: string, data: QuizSubmission) {
    const res = await fetch(`${QUIZ_API}/${quizId}/submit`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  // 3. التحقق من حالة الـ PIN للأب (من صفحة الـ /me)
  async checkPinStatus(): Promise<PinStatus> {
    const res = await fetch(`${USER_API}/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch user status");
    const data = await res.json();
    // الباك إند عندك بيرجع حقل اسمه has_pin محسوب من وجود quiz_pin
    return { has_pin: data.has_pin };
  },

  // 4. تحديث أو تعيين الـ PIN 
  // ✅ يضرب في الـ PUT /api/v1/users/pin
  async updatePin(pin: string): Promise<boolean> {
    const res = await fetch(`${USER_API}/pin`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ pin }) // الحقل اسمه pin ليتوافق مع PinRequest schema
    });
    if (!res.ok) throw new Error("Could not save new PIN");
    return res.ok;
  },

  // 5. التأكد من صحة الـ PIN لفتح صفحة الكويزات
  // ✅ يضرب في الـ POST /api/v1/users/pin/verify
  async verifyPin(pin: string): Promise<boolean> {
    const res = await fetch(`${USER_API}/pin/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ pin })
    });
    // لو رجع 400 أو 401 يبقى PIN غلط، لو 200 يبقى تمام
    return res.ok;
  },

  // 6. توليد كويز جديد باستخدام الذكاء الاصطناعي
  async generateQuiz(data: QuizGenerateRequest): Promise<Question[]> {
    const res = await fetch(`${QUIZ_API}/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error("AI failed to generate questions");
    return res.json();
  },

  // 7. حفظ الكويز وإسناده للطفل
  async saveQuiz(quizData: Partial<Quiz> & { child_id: string }) {
    const res = await fetch(`${QUIZ_API}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(quizData)
    });
    return res.ok;
  }
};