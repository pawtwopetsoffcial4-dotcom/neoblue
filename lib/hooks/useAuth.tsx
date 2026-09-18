'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'vendor' | 'admin' | 'employee';
  isApproved: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (name: string, email: string, password: string, phone: string, role: 'user' | 'vendor') => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  loginWithSocial: (name: string, email: string, idToken: string, role?: 'user' | 'vendor') => Promise<User>;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token from localStorage on mount and listen for expiration events
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');
        if (storedToken) {
          let isExpired = false;
          try {
            const parts = storedToken.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp && typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
                isExpired = true;
              }
            }
          } catch {
            isExpired = true;
          }

          if (isExpired) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            setToken(null);
            setUser(null);
            return;
          }

          setToken(storedToken);
        } else {
          setToken(null);
        }

        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem('authUser');
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to restore auth state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();

    const handleAuthExpired = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('storage', restoreAuth);
    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('storage', restoreAuth);
    };
  }, []);

  const signup = async (name: string, email: string, password: string, phone: string, role: 'user' | 'vendor'): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data.user as User;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data.user as User;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSocial = async (name: string, email: string, idToken: string, role?: 'user' | 'vendor'): Promise<User> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, idToken, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Social login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify(data.user));
      return data.user as User;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setSession = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        signup,
        login,
        loginWithSocial,
        setSession,
        logout,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
