// src/services/chatService.ts

const API_BASE = `${import.meta.env.VITE_API_URL}/chat-system`;

// ✅ التعديل هنا: توجيه الطلب لراوتر المكالمات الجديد لحل الـ 404
const CALL_BASE = `${import.meta.env.VITE_API_URL}/calls`;

export interface ChatMessage {
  _id?: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

// واجهة بيانات خوادم الـ ICE
export interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export const chatService = {
  // جلب تاريخ المحادثة
  async getHistory(otherEmail: string, token: string): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/history/${otherEmail}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch history");
    return res.json();
  },

  // تصفير عداد الرسايل (Mark as Read)
  async markAsRead(senderEmail: string, token: string): Promise<void> {
    await fetch(`${API_BASE}/mark-read/${senderEmail}`, {
      method: "POST",
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },

  // جلب عدد الرسايل غير المقروءة لكل المستخدمين
  async getUnreadCounts(token: string): Promise<Record<string, number>> {
    const res = await fetch(`${API_BASE}/unread-counts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.json();
  },

  // ✅ ميزة جلب خوادم الـ ICE من الباك إند للمكالمات (محدثة للمسار الجديد)
  async getIceServers(token: string): Promise<{ iceServers: IceServerConfig[] }> {
    const res = await fetch(`${CALL_BASE}/ice-servers`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch ICE servers");
    return res.json();
  }
};