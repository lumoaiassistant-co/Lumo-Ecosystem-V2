import cv2
import numpy as np
import base64
import logging
from typing import Tuple, Optional
from ultralytics import YOLO # ✅ استيراد المكتبة الجديدة

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VisionEngine")

class VisionEngine:
    def __init__(self):
        self.is_ready = False
        try:
            # ✅ تحميل موديل YOLOv8 Nano (الأسرع والأخف)
            # الموديل هيتحمل تلقائياً أول مرة تشغل فيها الكود
            self.model = YOLO("yolov8n.pt") 
            
            # التأكد من عمل الموديل (Warm-up)
            self.is_ready = True
            logger.info("YOLOv8 VisionEngine Initialized Successfully.")
        except Exception as e:
            logger.error(f"VisionEngine Init Error: {e}")
            self.is_ready = False

    def _prepare_image(self, base64_string: str) -> Optional[np.ndarray]:
        try:
            if "," in base64_string:
                base64_string = base64_string.split(',')[1]
            
            nparr = np.frombuffer(base64.b64decode(base64_string), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR) # YOLO بيفضل الألوان (BGR)
            
            if frame is None: 
                return None
            
            # تصغير الصورة لزيادة السرعة (Performance optimization)
            height, width = frame.shape[:2]
            target_width = 480 # YOLOv8 n بيتعامل كويس مع الحجم ده
            if width > target_width:
                scaling_factor = target_width / float(width)
                new_dims = (target_width, int(height * scaling_factor))
                frame = cv2.resize(frame, new_dims, interpolation=cv2.INTER_AREA)
            
            return frame

        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            return None

    def process_frame(self, base64_string: str) -> Tuple[str, bool]:
        """
        Analyzes frame for focus and distractions using YOLOv8.
        Returns: (Status Message, Is_Distracted_Boolean)
        """
        if not self.is_ready: 
            return "Initializing Engine...", False
        
        frame = self._prepare_image(base64_string)
        if frame is None: 
            return "No Signal", True

        # ✅ تشغيل الـ Detection
        # Classes: 0 (person), 67 (cell phone)
        results = self.model.predict(frame, conf=0.5, classes=[0, 67], verbose=False)
        
        people_count = 0
        phone_detected = False
        main_person_box = None

        for result in results:
            for box in result.boxes:
                cls = int(box.cls[0])
                if cls == 0: # Person
                    people_count += 1
                    # حفظ إحداثيات أول شخص (الأقرب غالباً)
                    if main_person_box is None:
                        main_person_box = box.xyxy[0].tolist() 
                elif cls == 67: # Cell phone
                    phone_detected = True

        # --- سيناريوهات التحليل ---

        # 1. تشتيت: وجود موبايل
        if phone_detected:
            return "Distraction: Phone Detected!", True

        # 2. تشتيت: أكتر من شخص (حد بيغشش الطفل مثلاً)
        if people_count > 1:
            return "Multiple People Detected", True

        # 3. تشتيت: مفيش حد قدام الكاميرا
        if people_count == 0:
            return "User Not Visible", True

        # 4. تحليل التركيز (لو فيه شخص واحد بس)
        if main_person_box:
            x1, y1, x2, y2 = main_person_box
            face_w = x2 - x1
            face_center_x = x1 + (face_w / 2)
            img_center_x = frame.shape[1] / 2
            
            # هل الشخص في نص الكادر؟ (سماحية 25%)
            is_centered = abs(img_center_x - face_center_x) < (frame.shape[1] * 0.25)
            
            # هل الشخص قريب كفاية؟
            is_visible_enough = face_w > (frame.shape[1] * 0.2)

            if is_centered and is_visible_enough:
                return "Perfectly Focused", False
            else:
                return "Looking Away or Out of Frame", True

        return "Analyzing...", False