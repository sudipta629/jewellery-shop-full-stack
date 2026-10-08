/**
 * Customer authentication context.
 * Manages login state, token storage, and profile.
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '../api/services';

interface Customer {
  id: number;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  is_email_verified: boolean;
}

interface AuthContextValue {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { access_token: string; refresh_token: string; customer: Customer }) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (tokens: { access_token: string; refresh_token: string; customer: Customer }) => {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
    setCustomer(tokens.customer);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setCustomer(null);
    authApi.logout().catch(() => {});
  };

  const refreshProfile = async () => {
    try {
      const profile = await authApi.me();
      setCustomer(profile as Customer);
    } catch {
      setCustomer(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    refreshProfile().finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider
      value={{ customer, isAuthenticated: !!customer, isLoading, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
