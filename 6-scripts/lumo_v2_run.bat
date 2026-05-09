@echo off
title Lumo V2 - Master Controller (Stable Edition)
color 0B

echo ====================================================
echo           LUMO V2 - SYSTEM AUTO-RUNNER
echo ====================================================
echo.

:: 1. تشغيل الـ AI Brain
echo [1/3] 🧠 Launching AI Brain (Lumo Core)...
cd /d "E:\projects\lumo - v2\4-ai_brain\core"
start "Lumo AI Brain" cmd /k "call conda activate lumo && echo 🚀 AI Brain Activated! && python Lumo.py"

:: ⏳ انتظار 5 ثواني عشان نمنع تصادم ملفات Conda المؤقتة
echo ⏳ Waiting for Conda to stabilize...
timeout /t 5 /nobreak > nul

:: 2. تشغيل الـ Backend
echo [2/3] 🛡️ Launching Backend Server...
cd /d "E:\projects\lumo - v2\2-backend"
:: جربنا ننادي uvicorn مباشرة بعد الـ activate
start "Lumo Backend" cmd /k "call conda activate lumo && echo 🚀 Backend Activated! && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: ⏳ انتظار 3 ثواني
timeout /t 3 /nobreak > nul

:: 3. تشغيل الـ Frontend
echo [3/3] 💻 Launching Frontend Interface...
cd /d "E:\projects\lumo - v2\3-frontend"
start "Lumo Frontend" cmd /k "echo 🚀 Starting Vite Dev Server... && npm run dev -- --host"

echo.
echo ====================================================
echo   ✅ All systems are firing! Lumo is now ALIVE.
echo ====================================================
pause > nul