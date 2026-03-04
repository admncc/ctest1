import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import PostJob from './pages/PostJob';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminJobs from './pages/admin/AdminJobs';
import AdminCategories from './pages/admin/AdminCategories';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '80px' }} />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" style={{ marginTop: '80px' }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        {/* Admin routes — no Navbar, own layout */}
        <Route path="/admin"            element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users"      element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/jobs"       element={<AdminRoute><AdminJobs /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />

        {/* Public routes */}
        <Route path="/*" element={
          <>
            <Navbar />
            <Routes>
              <Route path="/"              element={<Home />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/register"      element={<Register />} />
              <Route path="/jobs"          element={<Jobs />} />
              <Route path="/jobs/new"      element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
              <Route path="/jobs/:id"      element={<JobDetail />} />
              <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile/:id"   element={<Profile />} />
              <Route path="/messages"      element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="*"              element={<Navigate to="/" replace />} />
            </Routes>
          </>
        } />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
