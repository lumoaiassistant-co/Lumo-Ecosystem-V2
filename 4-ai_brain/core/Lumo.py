import ollama
import subprocess
import os
import sys
import time
import glob
import asyncio
import websockets
import re
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
from faster_whisper import WhisperModel

'''-----1. CONFIGURATION SECTION-----'''
ESP32_IP = "192.168.1.15"  # <--- حط الـ IP اللي ظهرلك في السيريال هنا
WS_URI = f"ws://{ESP32_IP}:81"

RECORD_SECONDS = 5
LOCAL_MODEL_NAME = 'llama3.2'

# المسارات (تأكد من صحتها في الفولدر عندك)
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
piper_exe = os.path.join(project_root, 'engine', 'piper', 'piper.exe')
model_path = os.path.join(project_root, 'engine', 'models', 'en_US-hfc_female-medium.onnx')
output_dir = os.path.join(project_root, 'logs', 'output')
os.makedirs(output_dir, exist_ok=True)
TEMP_AUDIO_FILE = os.path.join(project_root, 'logs', "temp_voice.wav")

# الـ Globals
piper_process = None
whisper_model = None
chat_history = [] 

'''-----2. LLM Setup (الـ Prompt الأصلي بتاعك)-----'''
system_prompt = (
    "You are a cute, helpful AI Child assistant called Lumo. You are connected to a TTS system. "
    "You should be friendly, extremely helpful and conversational while making sure your responses "
    "are not too long and don't contain any special characters apart from (!,.?) in order to ensure "
    "your text gets spoken properly. You must also add one and **only** one emotion at the end of "
    "your response in brackets. Your options are: (sad, angry, happy, confused, laugh, wave, kiss). "
    "Please choose an emotion that best represents the generated text."
)
chat_history.append({'role': 'system', 'content': system_prompt})

'''-----3. NETWORK FUNCTIONS (Binary Audio Support)-----'''
async def send_to_robot(char=None, audio_bytes=None):
    """إرسال الحروف (حركات) أو الداتا (صوت) للروبوت وايرلس"""
    try:
        async with websockets.connect(WS_URI, timeout=5) as websocket:
            if char:
                await websocket.send(char)
                print(f"[WIFI] Mood Command '{char}' Sent.")
            if audio_bytes:
                await websocket.send(audio_bytes)
                print(f"[WIFI] Audio Binary Data Sent ({len(audio_bytes)} bytes).")
    except Exception as e:
        print(f"[WIFI ERROR] Connection failed: {e}")

def get_mapped_char(command):
    """تحويل اسم الـ Emotion للحرف اللي الـ ESP32 بيفهمه"""
    cmd_map = {
        "think": "t", "confused": "t",
        "happy": "h", "smile": "h", "laugh": "h", "wave": "h",
        "kiss": "k", "love": "k",
        "sad": "s", "angry": "a", "idle": "i"
    }
    return cmd_map.get(command.lower(), "i")

'''-----4. HARDWARE & AI INITIALIZATION-----'''
def setup_systems():
    global piper_process, whisper_model
    print("--- Loading Whisper AI ---")
    whisper_model = WhisperModel("small.en", device="cpu", compute_type="int8")
    
    if os.path.exists(piper_exe):
        piper_process = subprocess.Popen(
            [piper_exe, "--model", model_path, "--output_dir", output_dir],
            stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
        )
    print("SUCCESS: System Ready and WiFi Client Configured")

'''-----5. LOGIC & INTERACTION-----'''
def record_audio():
    fs = 16000
    print("\n[LISTENING] Speak now...")
    recording = sd.rec(int(RECORD_SECONDS * fs), samplerate=fs, channels=1)
    sd.wait()
    data_int = (recording * 32767).astype(np.int16)
    wav.write(TEMP_AUDIO_FILE, fs, data_int)
    return TEMP_AUDIO_FILE

def process_interaction():
    # 1. تحويل الصوت لنص (STT)
    audio_path = record_audio()
    segments, _ = whisper_model.transcribe(audio_path, beam_size=5)
    user_text = " ".join([s.text for s in segments]).strip()
    
    if len(user_text) < 2: return
    print(f"You: {user_text}")

    # 2. أمر التفكير (إرسال 't' للـ ESP32 فوراً)
    asyncio.run(send_to_robot(char="t"))

    # 3. الحصول على الرد من Ollama
    chat_history.append({'role': 'user', 'content': user_text})
    response = ollama.chat(model=LOCAL_MODEL_NAME, messages=chat_history)
    response_text = response['message']['content'].strip()
    chat_history.append({'role': 'assistant', 'content': response_text})

    # 4. استخراج الايموشن وتنظيف النص
    emotions = re.findall(r"[\(\[\{](.*?)[\)\]\}]", response_text)
    current_emotion = emotions[-1].strip() if emotions else "happy"
    clean_text = re.sub(r"[\(\[\{].*?[\)\]\}]", "", response_text).strip()
    
    print(f"Lumo: {clean_text} [{current_emotion}]")

    # 5. توليد الصوت (Piper)
    for f in glob.glob(os.path.join(output_dir, "*.wav")):
        try: os.remove(f)
        except: pass

    piper_process.stdin.write(clean_text + "\n")
    piper_process.stdin.flush()

    # 6. انتظار الملف وإرساله Binary للروبوت
    start_wait = time.time()
    while time.time() - start_wait < 10:
        files = glob.glob(os.path.join(output_dir, "*.wav"))
        if files:
            time.sleep(0.5) # لضمان اكتمال كتابة الملف
            with open(files[0], "rb") as f:
                audio_binary = f.read()
                # إرسال حركة الايموشن أولاً ثم ملف الصوت
                asyncio.run(send_to_robot(char=get_mapped_char(current_emotion)))
                asyncio.run(send_to_robot(audio_bytes=audio_binary))
            break
        time.sleep(0.1)
    
    # العودة للـ Idle بعد انتهاء الرد
    time.sleep(2)
    asyncio.run(send_to_robot(char="i"))

def main():
    setup_systems()
    print("\n" + "="*40 + "\n LUMO SYSTEM READY \n" + "="*40)
    while True:
        input("\n[Press Enter to Speak]")
        try:
            process_interaction()
        except Exception as e:
            print(f"System Error: {e}")
            asyncio.run(send_to_robot(char="i"))

if __name__ == '__main__':
    main()