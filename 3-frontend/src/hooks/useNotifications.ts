import { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import React from 'react';
// استيراد القوالب من ملف الـ UI
import { ChatToast, DistractionToast } from '../components/NotificationTemplates';

export const useNotifications = () => {
  // استخدام Ref للصوت لضمان الأداء العالي
  const audio = useRef(new Audio('/assets/sounds/notification.mp3'));

  const playSound = useCallback(() => {
    if (audio.current) {
      audio.current.currentTime = 0; // إعادة الصوت للبداية لو فيه تنبيهات ورا بعض
      audio.current.play().catch((err) => console.log("🔊 Audio play blocked:", err));
    }
  }, []);

  /**
   * إرسال إشعار شات عادي
   */
  const notify = useCallback((sender: string, message: string) => {
    playSound();
    toast.custom((t) => React.createElement(ChatToast, { t, sender, message }), { 
      duration: 4000, 
      position: 'top-right' 
    });
  }, [playSound]);

  /**
   * إرسال تنبيه تشتت (YOLO Alert) للأب
   */
  const notifyFocusAlert = useCallback((childName: string, status: string, snapshot?: string) => {
    playSound();
    toast.custom((t) => React.createElement(DistractionToast, { 
      t, 
      childName, 
      status, 
      snapshot 
    }), { 
      duration: 8000, 
      position: 'top-right' 
    });
  }, [playSound]);

  return { notify, notifyFocusAlert, playSound };
};