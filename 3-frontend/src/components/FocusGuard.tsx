import { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ShieldCheck, AlertTriangle, EyeOff } from 'lucide-react';
import { useChild } from '../contexts/ChildContext';
import { useSocket } from '../contexts/SocketContext';
import { visionService } from '../services/visionService';

const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user"
};

export default function FocusGuard() {
  const webcamRef = useRef<Webcam>(null);
  const { activeChild } = useChild();
  const { emitEvent } = useSocket();
  const [status, setStatus] = useState("Initializing...");
  const [isAlert, setIsAlert] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // ✅ رادار التشتت: عداد داخلي لمنع التنبيهات الكاذبة
  const distractionCounter = useRef(0);
  const [hasSentAlert, setHasSentAlert] = useState(false);

  // ✅ وظيفة التعامل مع التنبيه (إرسال الإشارة واللقطة للأب)
  const handleDistractionAlert = useCallback(() => {
    if (!activeChild) return;
    
    setHasSentAlert(true);
    
    // 📸 التقاط لقطة للحظة التشتت لإرسالها كدليل
    const snapshot = webcamRef.current?.getScreenshot();
    
    // 🚀 إرسال التنبيه للأب عبر السوكيت العام
    if (activeChild.parent_email) {
      emitEvent("distraction_alert", activeChild.parent_email, {
        child_name: activeChild.name,
        status: status,
        snapshot: snapshot
      });
    }

    console.log("🚨 FocusGuard: Distraction alert emitted to parent.");
  }, [activeChild, status, emitEvent]);

  // ✅ إدارة الاتصال بـ YOLO Engine ومعالجة النتائج لحظياً
  useEffect(() => {
    if (!activeChild) return;

    visionService.connect();
    
    visionService.onResults((data) => {
      setStatus(data.status);
      setIsAlert(data.is_distracted);

      // --- منطق عداد التشتت (Accumulator) ---
      if (data.is_distracted) {
        distractionCounter.current += 1;
        
        // التحقق من استمرار التشتت لمدة 10 ثواني (5 فريمات * 2 ثانية)
        if (distractionCounter.current >= 5 && !hasSentAlert) {
          handleDistractionAlert();
        }
      } else {
        // إعادة التعيين بمجرد عودة التركيز
        distractionCounter.current = 0;
        setHasSentAlert(false);
      }
    });

    return () => {
      visionService.disconnect();
    };
  }, [activeChild, hasSentAlert, handleDistractionAlert]);

  // ✅ وظيفة التقاط وإرسال الفريم للباك إند
  const sendFrame = useCallback(() => {
    if (cameraError || !webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot({ width: 320, height: 240 });
    
    if (imageSrc) {
      visionService.sendFrame(imageSrc);
    }
  }, [cameraError]);

  useEffect(() => {
    // إرسال فريم كل 2 ثانية (تحليل YOLO متوازن)
    const interval = setInterval(sendFrame, 2000);
    return () => clearInterval(interval);
  }, [sendFrame]);

  if (!activeChild) return null;

  return (
    <div 
      className={`fixed bottom-6 right-6 z-[9999] transition-all duration-500 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`p-4 rounded-3xl shadow-2xl border-2 backdrop-blur-md transition-all ${
        isAlert 
          ? "bg-red-50/90 border-red-500 text-red-700 animate-pulse" 
          : "bg-white/90 border-emerald-500 text-emerald-700 dark:bg-gray-800/90 dark:border-emerald-500/50"
      }`}>
        
        {/* Webcam View: يظهر عند التشتت أو الوقوف بالماوس */}
        <div className={`overflow-hidden rounded-2xl bg-black border border-gray-200 dark:border-gray-700 transition-all duration-500 relative ${
          isHovered || isAlert ? "h-32 w-44 opacity-100 mb-4" : "h-0 w-0 opacity-0 mb-0"
        }`}>
          {!cameraError ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.6}
              videoConstraints={videoConstraints}
              onUserMediaError={() => setCameraError(true)}
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white text-[10px] text-center p-2">
              <EyeOff className="w-6 h-6 mb-1 text-red-500" />
              Camera Blocked
            </div>
          )}
          
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        </div>

        {/* Status UI */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full shadow-inner transition-colors ${isAlert ? "bg-red-200 text-red-700" : "bg-emerald-100 text-emerald-600"}`}>
            {isAlert ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div className="min-w-[100px]">
            <h3 className="font-black text-[9px] uppercase tracking-[0.2em] opacity-40 dark:text-white">Lumo Guard</h3>
            <p className="text-xs font-black truncate uppercase tracking-tighter">
                {cameraError ? "Hardware Error" : (isAlert ? (hasSentAlert ? "⚠️ ALERT SENT" : "DISTRACTED!") : status)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}