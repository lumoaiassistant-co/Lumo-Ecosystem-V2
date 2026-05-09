# 🤖 Lumo: AI-Powered Educational Ecosystem

![Lumo Banner](3-frontend/public/assets/lumo-3d-hero.png)

## 🌟 Executive Summary

**Lumo** is a cutting-edge educational ecosystem designed to redefine home learning for children through interactive technology and privacy-first architecture. It combines an intelligent Learning Management System (LMS), local AI processing, computer vision, and an interactive companion robot to create a safe, engaging, and focused learning environment.

---

## 🚀 Key Features

### 👁️ Neural Proctor System

Through its proprietary **Neural Proctor system**, Lumo uses computer vision (OpenCV) to intelligently monitor engagement and provide real-time feedback, ensuring a high-quality, distraction-free educational experience.

### 🛡️ Privacy-by-Design

Unlike traditional cloud-based systems, Lumo performs all sensitive AI interactions **locally on-device** using offline infrastructure (Ollama & Lumo 3.2), ensuring total protection of children’s data.

### 🎮 Gamified Explorer Interface

Educational tasks are transformed into interactive "Quests," making learning a fun and rewarding adventure for children aged 6-16.

### 📊 Parent Dashboard

A comprehensive analytics interface that allows parents to track progress, identify learning gaps, and customize the educational journey via "Heatmaps" and behavioral reports.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | FastAPI (Python), MongoDB, WebSockets |
| **AI Engine** | Ollama (Lumo3.2), OpenCV, PyTesseract |
| **Hardware** | ESP32-CAM, Arduino (C++), 3D Printed Chassis |

---

## 👥 The Team

* **Nourhan Mohammed Salem**
* **Shahd Ahmed Bakoush**
* **Mohammed Gamal Shaat**
* **Mohammed Osama Taha**
* **Ezz El-Din Karim Mousa**
* **Youssef Sayed Abo Bkr Elhussainy**

---

## 📦 Installation & Setup

1. **Backend:** Install requirements via `pip install -r 2-backend/requirements.txt`.
2. **Frontend:** Run `npm install` and `npm run dev` inside `3-frontend/`.
3. **AI Brain:** Ensure [Ollama](https://ollama.ai/) is installed and running `lumo3.2`.
