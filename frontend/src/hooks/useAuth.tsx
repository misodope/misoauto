import React, { useState, useEffect, createContext } from "react";
import { getApiUrl } from "../utils/env";

interface AuthData {
  access_token: string;
  refresh_token: string;
  createdAt: string;
  expires_at: string;
  open_id: string;
  refresh_expires_at: string;
  scope: string;
  updatedAt: string;
  id: number;
  expires_in: number;
  refresh_expires_in: number;
}

interface AuthResponse {
  message: string;
  response: AuthData;
}

interface AuthContextState {
  error: unknown | Error | null;
  authData: AuthData | null;
  authLoading: boolean;
  authStarted: boolean;
  isLoggedIn: boolean;
  setAuthData: (authData: AuthData | null) => void;
}

// Create Context for Auth Data
export const AuthContext = createContext<AuthContextState>({
  error: null,
  authData: null,
  authLoading: false,
  authStarted: false,
  isLoggedIn: false,
  setAuthData: () => null,
});

// Create Provider for Auth Context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authData, setAuthData] = useState<AuthData | null>(null);
  const [error, setError] = useState<unknown | Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);

  useEffect(() => {
    if (fetching) {
      console.log("Fetching server user data...");
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

          const data: AuthResponse = await response.json();

          setAuthData(data.response);
          setLoading(false);
          setFetching(false);
        } catch (error: unknown) {
          setError(error);
        }
      };

      fetchUserData();
    }
  }, [fetching]);

  useEffect(() => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("authData="));

    if (!authData) {
      console.log("No server data in state");
      if (!cookie) {
        console.log("No server data in cookie");
        // Set fetching to true to fetch user data
        setFetching(true);
        setLoading(true);
      } else {
        console.log("Found server data in cookie");
        const cookieAuthData = JSON.parse(cookie.split("=")[1]);
        setAuthData(cookieAuthData);
      }
    } else {
      console.log("Found server data in state");
      // Check if server data is in cookie
      if (!cookie) {
        console.log("No server data in cookie, but in state, setting cookie...");
        // Set server data in cookie for 1 day
        const expires = `; expires=${authData.expires_in}`;
        document.cookie = `authData=${JSON.stringify(
          authData,
        )}${expires}; path=/`;
      }
    }
  }, [authData]);

  // function check if user is logged in by checking expiration of cookie
  const isLoggedIn = () => {
    const cookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("authData="));
    console.log("Is Logged In?", cookie);
    if (!cookie && !authData) {
      return false;
    }

    if (authData && cookie) {
      const cookieAuthData = JSON.parse(cookie.split("=")[1]);
      const expires = new Date(cookieAuthData.expires_at);
      const now = new Date();

      return expires > now;
    }

    if (!cookie && authData) {
      const expires = new Date(authData.expires_at);
      const now = new Date();

      return expires > now;
    }

    return false;
  };

  const value = {
    authData,
    error,
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
