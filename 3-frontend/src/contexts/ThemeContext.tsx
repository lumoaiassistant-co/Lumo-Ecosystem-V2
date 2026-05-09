import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'auto';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // 1. جلب الثيم المخزن أو الافتراضي
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('lumo-theme');
    return (stored as Theme) || 'auto';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // 2. دالة لحساب الثيم الفعلي (Resolved)
  const getSystemTheme = useCallback((): ResolvedTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // 3. مراقبة التغييرات في الاختيار أو في نظام التشغيل
  useEffect(() => {
    const updateTheme = () => {
      if (theme === 'auto') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(theme as ResolvedTheme);
      }
    };

    updateTheme();

    // مستمع لتغيرات نظام التشغيل (لو المستخدم غير الويندوز من Light لـ Dark وهو فاتح الموقع)
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'auto') updateTheme();
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, getSystemTheme]);

  // 4. تطبيق الكلاس على عنصر الـ HTML
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    
    // لإضافة لمسة جمالية في الـ Browser UI (مثل لون الشريط العلوي في الموبايل)
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolvedTheme === 'dark' ? '#111827' : '#f9fafb');
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('lumo-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};