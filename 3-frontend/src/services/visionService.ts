// src/services/visionService.ts
import { VisionResult } from '../types/dashboard'; // ✅ استيراد الـ Interface الجديد

// ✅ تحديث النوع ليعتمد على الواجهة الموحدة
type VisionCallback = (results: VisionResult) => void;

class VisionService {
  private socket: WebSocket | null = null;
  
  // ✅ التعديل: القراءة من VITE_WS_URL لضمان عمل الـ FocusGuard على الموبايل والشبكة
  private url: string = `${import.meta.env.VITE_WS_URL}/vision/ws/focus-guard`;
  
  private onResultsCallback: VisionCallback | null = null;
  private reconnectTimeout: number | null = null;

  connect() {
    // منع تكرار الاتصال لو السوكيت مفتوح أو بيفتح فعلاً
    if (this.socket?.readyState === WebSocket.OPEN || this.socket?.readyState === WebSocket.CONNECTING) return;

    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      console.log("🚀 Lumo Vision Engine: Connected & Ready");
    };

    this.socket.onmessage = (event) => {
      try {
        const data: VisionResult = JSON.parse(event.data); // ✅ تحديد النوع هنا
        if (this.onResultsCallback) {
          this.onResultsCallback(data);
        }
      } catch (err) {
        console.error("❌ Vision Service Parse Error:", err);
      }
    };

    this.socket.onclose = () => {
      console.log("🛑 Vision Service Connection Lost. Reconnecting in 3s...");
      // تنظيف أي تايم أوت قديم قبل عمل واحد جديد
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // استخدام window.setTimeout لضمان النوع الصحيح في المتصفح
      this.reconnectTimeout = window.setTimeout(() => this.connect(), 3000);
    };

    this.socket.onerror = (err) => {
      console.error("❌ Vision Service Socket Error:", err);
    };
  }

  /**
   * إرسال فريم الكاميرا (Base64) لمحرك YOLOv8
   */
  sendFrame(base64Image: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(base64Image);
    }
  }

  /**
   * تسجيل الدالة اللي هتتنفذ لما النتيجة توصل من السيرفر
   */
  onResults(callback: VisionCallback) {
    this.onResultsCallback = callback;
  }

  /**
   * إغلاق الاتصال تماماً (عند الخروج من الصفحة مثلاً)
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.onclose = null; // نمنع الـ Reconnect التلقائي عند الإغلاق المتعمد
      this.socket.close();
      this.socket = null;
    }
    this.onResultsCallback = null;
  }
}

// تصدير نسخة واحدة ثابتة (Singleton) للسيستم كله
export const visionService = new VisionService();