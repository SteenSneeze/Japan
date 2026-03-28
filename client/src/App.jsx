import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Nav from './components/Nav';
import HomePage from './pages/HomePage';
import PlanPage from './pages/PlanPage';
import TripPage from './pages/TripPage';
import AdminPage from './pages/AdminPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import './index.css';

function AppInner() {
  const { user } = useAuth();
  return (
    <>
      {user?.must_change_password && <ChangePasswordModal />}
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/trip" element={<TripPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  );
}
