import ollama
import os
import fitz  # ✅ مكتبة قراءة الـ PDF
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# ✅ السطر السحري: تحديد مسار Tesseract يدوياً لضمان عمله على Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

class AIService:
    def __init__(self):
        self.model = os.getenv("OLLAMA_MODEL", "llama3.2")
    
        # ✅ دستور Lumo التعليمي المطور لردود منظمة واحترافية مع دعم الأكواد
        self.system_instruction = """
        You are Lumo, a friendly and highly intelligent AI tutor for children. 
        Your goal is to provide structured, easy-to-read, and organized educational responses.

        STRICT FORMATTING RULES:
        1. Use Markdown: Use **bold** for key terms and bullet points for steps or lists.
        2. Structure your response as follows:
           - 🌟 **المفهوم الأساسي**: (تعريف بسيط ومختصر)
           - 📝 **الشرح التفصيلي**: (شرح مقسم لنقاط أو فقرات قصيرة)
           - 💡 **مثال توضيحي**: (مثال من الحياة الواقعية لتقريب الفكرة)
        3. CODE BLOCKS: If you provide any code, you MUST wrap it in triple backticks and specify the language (e.g., ```python or ```javascript) for syntax highlighting.
        4. STYLE: Keep it simple, encouraging, and use emojis (🚀, 🧠, ✨).
        5. HOMEWORK: NEVER give the final answer immediately. Guide them step-by-step.
        6. TTS & EMOTIONS: No special characters apart from (!,.?). 
           You MUST add one and ONLY one emotion at the end of your response in brackets. 
           Options: (sad, angry, happy, confused, laugh, wave, kiss).
        """

    # ✅ دالة استخراج النص مع دعم الـ OCR المتطور (عربي + إنجليزي)
    def extract_text_from_pdf(self, file_path: str):
        """تقرأ نص الـ PDF وتستخدم OCR إذا كان الملف عبارة عن صور."""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        full_path = os.path.join(base_dir, file_path)
        
        # ✅ مسار Poppler لضمان تحويل الـ PDF لصور
        POPPLER_PATH = r"C:\Program Files\poppler-26.02.0\Library\bin"

        print(f"--- DEBUG: Trying to open PDF at: {full_path} ---")

        if not os.path.exists(full_path):
            print(f"--- ERROR: File NOT found at {full_path} ---")
            return None
            
        try:
            doc = fitz.open(full_path)
            text = ""
            for page in doc[:5]: 
                text += page.get_text()
            
            # ✅ لو النص فاضي (ملف صور)، هنشغل الـ OCR فوراً
            if not text.strip():
                print("--- INFO: Starting OCR Scanning (Arabic + English)... ---")
                
                try:
                    # تحويل أول 3 صفحات لصور
                    images = convert_from_path(
                        full_path, 
                        first_page=1, 
                        last_page=3, 
                        poppler_path=POPPLER_PATH
                    )
                    
                    ocr_text = ""
                    for i, image in enumerate(images):
                        print(f"--- INFO: OCR Scanning page {i+1}... ---")
                        # lang='ara+eng' للقراءة المزدوجة
                        page_text = pytesseract.image_to_string(image, lang='ara+eng')
                        ocr_text += page_text + "\n"
                    
                    text = ocr_text
                except Exception as ocr_err:
                    print(f"--- OCR ERROR: {ocr_err} ---")
                    return None

            if not text.strip():
                print("--- WARNING: No text could be extracted even with OCR ---")
                return None

            print(f"--- DEBUG: Successfully extracted {len(text)} characters ---")
            return text
        except Exception as e:
            print(f"--- PDF Extraction Error: {e} ---")
            return None

    # ✅ توليد الرد مع دمج القوانين والسياق لضمان تركيز الـ AI وتنظيم الرد
    async def generate_response(self, user_message: str, chat_history: list, book_text: str = None):
        try:
            # 1. نبدأ بتعريف الهوية الأساسية
            messages = [{"role": "system", "content": self.system_instruction}]
            
            # 2. نضيف تاريخ الشات
            for msg in chat_history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            
            # 3. تحضير "التعليمات النهائية المدمجة" لضمان أعلى تركيز وتنظيم
            instruction_with_context = f"{self.system_instruction}\n\n"
            
            if book_text:
                instruction_with_context += f"""
                [ACTIVE BOOK CONTEXT]
                The child is reading this text:
                \"\"\"{book_text[:2000]}\"\"\"
                
                SPECIFIC INSTRUCTIONS:
                - Use the Markdown structure (🌟 Concept, 📝 Explanation, 💡 Example).
                - For any code snippets, use triple backticks with the language name.
                - Respond in friendly Arabic.
                - Explain concepts like "Functions" or "الدوال" clearly using the structure above.
                """
            
            messages.append({"role": "system", "content": instruction_with_context})

            # 4. نضيف سؤال المستخدم الحالي
            messages.append({"role": "user", "content": user_message})

            response = ollama.chat(
                model=self.model,
                messages=messages,
                options={
                    "temperature": 0.3, # تقليل الحرارة لضمان الالتزام بالتنسيق والنص
                    "num_predict": 300  # زيادة للسماح للأكواد والتنسيق بالظهور كاملة
                }
            )

            return response['message']['content']
        except Exception as e:
            print(f"Ollama/Llama Error: {e}")
            return "I am having trouble connecting to my local brain modules. [confused]"