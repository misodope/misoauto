'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import api, {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
} from '../../lib/axios';

export interface SocialAccount {
  id: number;
  platform: {
    id: number;
    name: string;
    displayName: string;
  };
  username: string;
  accountId: string;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  smsConsent: boolean;
  emailConsent: boolean;
  socialAccounts?: SocialAccount[];
}

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoggedIn = user !== null;

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const profileResponse = await api.get<User>('/auth/me');
    setUser(profileResponse.data);
    return profileResponse.data;
  }, []);

  // Rehydrate session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // If we already have an access token (e.g., just logged in/register), skip refresh
        if (getAccessToken()) {
          await refreshUser();
          return;
        }

        // Otherwise try to refresh using httpOnly cookie
        const refreshResponse = await api.post<{ accessToken: string }>(
          '/auth/refresh',
        );
        setAccessToken(refreshResponse.data.accessToken);

        // Fetch user profile with the new token
        await refreshUser();
      } catch {
        // No valid session, user needs to login
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [refreshUser]);

  const login = useCallback(
    async (userData: User) => {
      // Optimistically set user so UI updates immediately after login/register
      setUser(userData);
      // Best-effort fetch to hydrate full profile (e.g., social accounts)
      try {
        await refreshUser();
      } catch {
        // Ignore — interceptor will handle refresh if needed
      }
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with local logout even if server call fails
    } finally {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, login, logout, refreshUser }}
    >
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
