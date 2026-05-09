# **Step 1: Create the Environment**

conda create -n lumo python=3.12 -y

Step 2: Activate the Environment

Step 3: Install PyTorch (GPU Version)

pip install torch torchvision torchaudio --index-url <https://download.pytorch.org/whl/cu124>

Step 4: Install Lumo Libraries

pip install RealtimeSTT google-generativeai pyserial sounddevice soundfile pyaudio

Step 5: install ollama - pip install ollama

Step 6: used model is llama3:8b

uvicorn app.main:app --host 0.0.0.0 --port 8000
conda activate lumo
npm run dev -- --host
