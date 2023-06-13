import React, { useState, useEffect, createContext } from "react";
import { getApiUrl } from "../../../services/utils/env";

interface AuthData {
  accessToken: string;
  refreshToken: string;
  createdAt: string;
  expiresAt: string;
  openId: string;
  refreshExpiresAt: string;
  scope: string;
  updatedAt: string;
  id: number;
  expiresIn: number;
  refreshExpiresIn: number;
}

interface AuthProps {
  authData: AuthData | null;
  setAuthData: (authData: AuthData | null) => void;
  error: unknown | Error | null;
  loading: boolean;
  fetching: boolean;
  setFetching: (fetching: boolean) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuth = (): AuthProps => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [error, setError] = useState<unknown | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);

  useEffect(() => {
    if (fetching) {
      console.log("Fetching auth user data...");
      // Check for user param in url
      const urlParams = new URLSearchParams(window.location.search);
      const user = urlParams.get("user");
      if (!user) {
        return;
      }

      // Fetch user data
      const fetchUserData = async () => {
        try {
          const url = `${getApiUrl()}/auth/get?openId=${user}`;
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }

          const data: AuthData = await response.json();

          setAuthData(data);
          setLoading(false);
          setFetching(false);
        } catch (error: unknown) {
          setError(error);
        }
      };

      fetchUserData();
    }
  }, [fetching]);

  return {
    authData,
    error,
    loading,
    fetching,
    setFetching,
    setLoading,
    setAuthData,
  };
};

interface AuthContextState {
  authData: AuthData | null;
  authLoading: boolean;
  authStarted: boolean;
  isLoggedIn: boolean;
  setAuthData: (authData: AuthData | null) => void;
}

// Create Context for Auth Data
export const AuthContext = createContext<AuthContextState>({
  authData: null,
  authLoading: false,
  authStarted: false,
  isLoggedIn: false,
  setAuthData: () => null,
});

// Create Provider for Auth Context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { authData, loading, setFetching, setLoading, setAuthData } = useAuth();

  useEffect(() => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("authData="));

    if (!authData) {
      console.log("No auth data in state");
      if (!cookie) {
        console.log("No auth data in cookie");
        // Set fetching to true to fetch user data
        setFetching(true);
        setLoading(true);
      } else {
        console.log("Found auth data in cookie");
        const cookieAuthData = JSON.parse(cookie.split("=")[1]);
        setAuthData(cookieAuthData);
      }
    } else {
      console.log("Found auth data in state");
      // Check if auth data is in cookie
      if (!cookie) {
        console.log("No auth data in cookie, but in state, setting cookie...");
        // Set auth data in cookie for 1 day
        const expires = `; expires=${authData.expiresIn}`;
        document.cookie = `authData=${JSON.stringify(
          authData
        )}${expires}; path=/`;
      }
    }
  }, [authData]);

  // function check if user is logged in by checking expiration of cookie
  const isLoggedIn = () => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("authData="));

    if (!cookie && !authData) {
      return false;
    }

    if (authData && cookie) {
      const cookieAuthData = JSON.parse(cookie.split("=")[1]);
      const expires = new Date(cookieAuthData.expiresAt);
      const now = new Date();

      return expires > now;
    }

    if (!cookie && authData) {
      const expires = new Date(authData.expiresAt);
      const now = new Date();

      return expires > now;
    }

    return false;
  };

  const value = {
    authData,
    authLoading: loading,
    authStarted: loading && !authData,
    isLoggedIn: isLoggedIn(),
    setAuthData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextState => {
  const authData = React.useContext(AuthContext);
  return authData;
};
