import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthApi } from '../api/services';

interface AdminUser {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access_token: string; refresh_token: string; admin: AdminUser }) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = ({ access_token, refresh_token, admin: adminUser }: {
    access_token: string; refresh_token: string; admin: AdminUser;
  }) => {
    localStorage.setItem('admin_access_token', access_token);
    localStorage.setItem('admin_refresh_token', refresh_token);
    setAdmin(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    setAdmin(null);
    adminAuthApi.logout().catch(() => {});
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (!token) { setIsLoading(false); return; }
    adminAuthApi.me()
      .then((data) => setAdmin(data as AdminUser))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isAuthenticated: !!admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be within AdminAuthProvider');
  return ctx;
}
