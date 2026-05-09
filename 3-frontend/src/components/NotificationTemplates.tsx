// ✅ شلنا import React لأنه غير مستخدم، واستوردنا نوع Toast الأصلي
import { toast, Toast } from 'react-hot-toast';

// --- إشعار الشات العادي ---
// ✅ استبدلنا any بـ Toast عشان نرضي الـ ESLint ونضمن الـ Type Safety
export const ChatToast = ({ t, sender, message }: { t: Toast, sender: string, message: string }) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl rounded-[1.5rem] pointer-events-auto flex ring-1 ring-purple-500/20 p-4 border-l-4 border-purple-500`}>
    <div className="flex-1 w-0">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5 text-2xl">💬</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter">
            New from {sender.split('@')[0]}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1 italic font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
    <div className="flex border-l border-gray-100 dark:border-gray-700 ml-4 pl-4">
      <button
        onClick={() => toast.dismiss(t.id)}
        className="text-[10px] font-black text-purple-600 uppercase hover:text-purple-500 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  </div>
);

// --- إشعار التشتت (YOLO Focus Alert) ---
export const DistractionToast = ({ t, childName, status, snapshot }: { t: Toast, childName: string, status: string, snapshot?: string }) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-red-600 text-white shadow-2xl rounded-[2rem] pointer-events-auto flex flex-col overflow-hidden ring-4 ring-white/20 backdrop-blur-xl`}>
    {snapshot && (
      <div className="w-full h-44 bg-black border-b border-white/10">
        <img 
          src={snapshot} 
          alt="Distraction Evidence" 
          className="w-full h-full object-cover"
          // تحسين: إضافة loading lazy للأداء
          loading="lazy"
        />
      </div>
    )}
    <div className="p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl animate-bounce">🚨</span>
        <h3 className="font-black uppercase tracking-tighter text-lg leading-none">Focus Alert!</h3>
      </div>
      <p className="text-sm font-medium opacity-90 leading-tight">
         Your child <b className="underline decoration-white/50">{childName}</b> is currently distracted: <span className="font-black italic">{status}</span>
      </p>
      <button 
        onClick={() => {
          toast.dismiss(t.id);
          // تحسين: استخدام window.location.assign كبديل أكثر أماناً
          window.location.assign('/parent/monitoring');
        }}
        className="mt-4 w-full bg-white text-red-600 py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-gray-100 transition-colors shadow-lg active:scale-95 duration-200"
      >
        Check Monitoring Live
      </button>
    </div>
  </div>
);