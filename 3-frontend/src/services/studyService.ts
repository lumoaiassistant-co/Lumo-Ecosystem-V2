// ✅ القراءة من ملف الـ .env لضمان المرونة الكاملة
const API_URL = import.meta.env.VITE_API_URL;
const API_BASE = `${API_URL}/study`;

// ✅ تحديث الواجهة لتشمل الحقول الجديدة
export interface Book {
  id: string;
  title: string;
  category: string;
  thumbnail?: string; 
  file_url: string;   
  upload_date: string;
  pages_count: number; // الحقل الجديد
  difficulty: string;  // الحقل الجديد (Easy, Medium, Hard)
}

export const studyService = {
  // 1️⃣ جلب قائمة الكتب
  async getBooks(query: string, category: string): Promise<Book[]> {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ q: query, category });
    
    const res = await fetch(`${API_BASE}/books?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to fetch library books');
    
    const data = await res.json();
    
    const backendUrl = API_URL.replace('/api/v1', '');

    // معالجة الروابط لتعمل في الـ Light/Dark mode وتظهر الصور صح
    return data.map((book: Book) => ({
      ...book,
      thumbnail: book.thumbnail?.startsWith('http') 
        ? book.thumbnail 
        : `${backendUrl}${book.thumbnail}`,
      file_url: book.file_url?.startsWith('http') 
        ? book.file_url 
        : `${backendUrl}${book.file_url}`
    }));
  },

  // 2️⃣ رفع كتاب جديد مع الحقول الإضافية (Pages, Difficulty, Cover)
  async uploadBook(
    file: File, 
    title: string, 
    category: string, 
    pages_count: number, 
    difficulty: string, 
    cover?: File
  ): Promise<Book> {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    
    // إلحاق البيانات الأساسية
    formData.append('file', file);
    formData.append('title', title);
    formData.append('category', category);
    
    // ✅ إلحاق البيانات الجديدة
    formData.append('pages_count', pages_count.toString());
    formData.append('difficulty', difficulty);
    
    // ✅ إلحاق صورة الغلاف لو موجودة
    if (cover) {
      formData.append('cover', cover);
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
        // ملحوظة: لا نضع Content-Type هنا، المتصفح سيتعامل مع الـ FormData والـ Boundary
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Failed to upload book');
    }

    return res.json();
  },

  // 3️⃣ مسح كتاب
  async deleteBook(bookId: string): Promise<void> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/books/${bookId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to delete book');
  }
};