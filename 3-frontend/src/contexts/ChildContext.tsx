import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// استيراد النوع الموحد اللي عملناه قبل كدة
import { ChildProfile } from '../types/settings'; 

interface ChildContextType {
  activeChild: ChildProfile | null;
  setActiveChild: (child: ChildProfile | null) => void;
  clearActiveChild: () => void; // إضافة دالة للمسح وقت الـ Logout
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

export const ChildProvider = ({ children }: { children: ReactNode }) => {
  // استخدام try-catch لتجنب كراش الأبلكيشن لو الـ localStorage فيه داتا باظت
  const [activeChild, setActiveChildState] = useState<ChildProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lumo-active-child');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to parse active child:", error);
      return null;
    }
  });

  // مزامنة الـ State مع الـ LocalStorage تلقائياً
  const setActiveChild = (child: ChildProfile | null) => {
    setActiveChildState(child);
    if (child) {
      localStorage.setItem('lumo-active-child', JSON.stringify(child));
    } else {
      localStorage.removeItem('lumo-active-child');
    }
  };

  const clearActiveChild = () => {
    setActiveChildState(null);
    localStorage.removeItem('lumo-active-child');
  };

  // تنظيف الداتا لو التوكن اتمسح (مثلاً لو حصل Logout من تاب تانية)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) clearActiveChild();
  }, []);

  return (
    <ChildContext.Provider value={{ activeChild, setActiveChild, clearActiveChild }}>
      {children}
    </ChildContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useChild = () => {
  const context = useContext(ChildContext);
  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }
  return context;
};