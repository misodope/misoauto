'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  impersonateLogin: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for JWT token on client side
    const jwt = Cookies.get('jwt-token');
    setIsLoggedIn(!!jwt);
    setIsLoading(false);
  }, []);

  const login = () => {
    setIsLoggedIn(true);
  };
  
  const logout = () => {
    Cookies.remove('jwt-token');
    setIsLoggedIn(false);
  };

  const impersonateLogin = () => {
    // Set a mock JWT token for development
    Cookies.set('jwt-token', 'dev-mock-token', { expires: 1 });
    setIsLoggedIn(true);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout, impersonateLogin }}>
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
