import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/ui';
import Home from './pages/Home';
import Admissions from './pages/Admissions';
import Login from './pages/Login';
import StudentPortal from './pages/student/StudentPortal';
import AdminConsole from './pages/admin/AdminConsole';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Protected({ role, children }: { role: 'admin' | 'student'; children: React.ReactElement }) {
  const auth = useAuth();
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
          <p className="text-mist text-sm tracking-widest uppercase">Opening your portal</p>
        </div>
      </div>
    );
  }
  if (!auth.user || auth.role !== role) return <Navigate to={`/login?as=${role}`} replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/student/:tab?"
              element={
                <Protected role="student">
                  <StudentPortal />
                </Protected>
              }
            />
            <Route
              path="/admin/:tab?"
              element={
                <Protected role="admin">
                  <AdminConsole />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
