import { ChatSession, ApiChatMessage } from '../types/ai';

const API_BASE = `${import.meta.env.VITE_API_URL}/ai`;

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
});

export const aiService = {
  async getSessions(childId?: string): Promise<ChatSession[]> {
    const query = childId ? `?child_id=${childId}` : "";
    const res = await fetch(`${API_BASE}/sessions${query}`, { headers: getHeaders() });
    return res.json();
  },

  async getHistory(sessionId: string): Promise<ApiChatMessage[]> {
    const res = await fetch(`${API_BASE}/history/${sessionId}`, { headers: getHeaders() });
    return res.json();
  },

  // ✅ تحديث الدالة لاستقبال bookId اختيارياً
  async sendMessage(message: string, sessionId: string | null, childId?: string, bookId?: string) {
    let query = childId ? `?child_id=${childId}` : "";
    
    // ✅ إضافة الـ book_id للـ query string بشكل سليم
    if (bookId) {
        query += (query ? "&" : "?") + `book_id=${bookId}`;
    }

    const res = await fetch(`${API_BASE}/chat${query}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ session_id: sessionId, message })
    });
    
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to connect to Lumo.");
    }
    return res.json();
  },

  async deleteSession(sessionId: string) {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.ok;
  }
};