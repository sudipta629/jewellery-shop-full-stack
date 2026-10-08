import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminProtectedRoute() {
  const { isAuthenticated, isLoading } = useAdminAuth();
  if (isLoading) return (
    <div className="min-h-screen bg-dark-800 flex items-center justify-center">
      <div className="text-gold-500 animate-pulse text-sm">Authenticating…</div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}
