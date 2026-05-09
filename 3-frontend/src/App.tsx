import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChildProvider } from './contexts/ChildContext';
import { SocketProvider } from './contexts/SocketContext'; 
import { CallProvider } from './contexts/CallContext'; // ✅ إضافة الـ Provider الجديد
import { Toaster } from 'react-hot-toast'; 
import { ReactNode } from 'react';

// 1. Layouts
import ChildLayout from './components/layouts/ChildLayout';
import ParentLayout from './components/layouts/ParentLayout';

// 2. Public Pages
import Onboarding from './pages/Onboarding';
import Signup from './pages/auth/Signup';
import Login from './pages/auth/Login';

// 3. Child Pages
import Dashboard from './pages/Dashboard';
import Study from './pages/Study';
import BookReader from './pages/BookReader'; // ✅ استيراد صفحة القارئ الجديدة
import AiTutor from './pages/AiTutor';
import Quizzes from './pages/Quizzes';
import Settings from './pages/Settings'; 
import Chat from './pages/chat/ChatPage'; 

// 4. Parent Pages
import ParentDashboard from './pages/parent/Dashboard'; 
import Monitoring from './pages/parent/Monitoring';
import QuizMaker from './pages/parent/QuizMaker';
import ParentLibrary from './pages/parent/ParentLibrary'; // ✅ تم إضافة الصفحة الجديدة هنا
import ManageKids from './pages/parent/kids/ManageKids'; 
import ParentSettings from './pages/parent/settings/ParentSettings'; 
import ParentChat from './pages/chat/ChatPage'; 

// === Guard: يحمي المسارات ويتحقق من الـ Role ===
interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole?: 'parent' | 'child';
}

const ProtectedRoute = ({ children, allowedRole }: ProtectedRouteProps) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role')?.toLowerCase(); 

  if (!token) return <Navigate to="/login" replace />;
  
  if (!role) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-pulse font-display">Verifying Lumo Identity...</div>
      </div>
    );
  }

  if (allowedRole && role !== allowedRole.toLowerCase()) {
    const target = role === 'parent' ? "/parent/dashboard" : "/dashboard";
    if (window.location.pathname !== target) {
      return <Navigate to={target} replace />;
    }
  }

  return <>{children}</>;
};

// === Guard: يمنع دخول المسجلين لصفحات الـ Auth ===
const PublicRoute = ({ children }: { children: ReactNode }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role')?.toLowerCase();
  
  if (token && role) {
    return <Navigate to={role === 'parent' ? "/parent/dashboard" : "/dashboard"} replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <ChildProvider>
        <BrowserRouter>
          <SocketProvider>
            {/* ✅ الـ CallProvider بيغلف الـ Routes عشان المكالمات تشتغل في أي صفحة */}
            <CallProvider> 
              <Toaster position="top-right" reverseOrder={false} />
              
              <Routes>
                {/* --- 🌍 Public Routes --- */}
                <Route path="/" element={<PublicRoute><Onboarding /></PublicRoute>} />
                <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

                {/* --- 👶 Child Routes --- */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><Dashboard /></ChildLayout>
                  </ProtectedRoute>
                } />
                <Route path="/study" element={
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><Study /></ChildLayout>
                  </ProtectedRoute>
                } />

                {/* ✅ مسار قارئ الكتب الجديد - يفتح Full Screen للمذاكرة مع Lumo */}
                <Route path="/study/reader/:bookId" element={
                  <ProtectedRoute allowedRole="child">
                    <BookReader />
                  </ProtectedRoute>
                } />

                <Route path="/tutor" element={
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><AiTutor /></ChildLayout>
                  </ProtectedRoute>
                } />
                <Route path="/quizzes" element={
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><Quizzes /></ChildLayout>
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={ 
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><Chat /></ChildLayout>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRole="child">
                    <ChildLayout><Settings /></ChildLayout>
                  </ProtectedRoute>
                } />

                {/* --- 🛡️ Parent Routes --- */}
                <Route path="/parent/dashboard" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><ParentDashboard /></ParentLayout> 
                  </ProtectedRoute>
                } />
                <Route path="/parent/monitoring" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><Monitoring /></ParentLayout>
                  </ProtectedRoute>
                } />
                <Route path="/parent/quiz-maker" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><QuizMaker /></ParentLayout>
                  </ProtectedRoute>
                } />

                <Route path="/parent/library" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><ParentLibrary /></ParentLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/parent/chat" element={ 
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><ParentChat /></ParentLayout>
                  </ProtectedRoute>
                } />

                <Route path="/parent/kids" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><ManageKids /></ParentLayout> 
                  </ProtectedRoute>
                } />

                <Route path="/parent/settings" element={
                  <ProtectedRoute allowedRole="parent">
                    <ParentLayout><ParentSettings /></ParentLayout> 
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CallProvider>
          </SocketProvider>
        </BrowserRouter>
      </ChildProvider>
    </ThemeProvider>
  );
}

export default App;