'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setAccessToken, getAccessToken, clearAccessToken } from '../../lib/axios';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (accessToken: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Try to restore session on mount by attempting a token refresh
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to refresh tokens - if successful, user has valid session
        const response = await api.post<{ accessToken: string }>('/auth/refresh');
        setAccessToken(response.data.accessToken);
        setIsLoggedIn(true);
      } catch {
        // No valid refresh token, user needs to login
        clearAccessToken();
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback((accessToken: string) => {
    setAccessToken(accessToken);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with local logout even if server call fails
    } finally {
      clearAccessToken();
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export utility for checking auth state outside React components
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};
