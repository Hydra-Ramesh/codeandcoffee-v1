'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'CONTRIBUTOR' | 'ADMIN';
  avatar?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithOAuth: (provider: 'google' | 'github', email: string, name: string, avatar?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setSessionFromToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Verifies HttpOnly session cookie automatically via credentials: include, with Bearer header fallback
    fetchApi('/auth/me', {
      headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
    })
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (res.success && res.data) {
      localStorage.setItem('token', res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (res.success && res.data) {
      localStorage.setItem('token', res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const loginWithOAuth = async (provider: 'google' | 'github', email: string, name: string, avatar?: string) => {
    const res = await fetchApi('/auth/oauth-callback', {
      method: 'POST',
      body: JSON.stringify({ provider, email, name, avatar }),
    });

    if (res.success && res.data) {
      localStorage.setItem('token', res.data.accessToken);
      setToken(res.data.accessToken);
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // Non-fatal
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await fetchApi('/auth/me');
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    }
  };

  const setSessionFromToken = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    const res = await fetchApi('/auth/me', {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const isAdmin = user?.role === 'ADMIN';
  const isContributor = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isContributor,
        login,
        register,
        loginWithOAuth,
        logout,
        refreshUser,
        setSessionFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
