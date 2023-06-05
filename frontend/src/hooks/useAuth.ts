import { useState, useEffect } from "react";
import { getApiUrl } from "../../../services/utils/env";

interface AuthData {}

export const useAuth = (): AuthData | null => {
  const [authData, setAuthData] = useState<AuthData | null>(null);

  useEffect(() => {
    // Check for user param in url
    const urlParams = new URLSearchParams(window.location.search);
    const user = urlParams.get("user");
    if (!user) {
      return;
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        console.log("INSIDE FETCH USER DATA");
        const url = `${getApiUrl()}/auth/get?openId=${user}`;
        console.log("URL: ", url);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const data = await response.json();
        setAuthData(data);
      } catch (error) {
        console.error(error);
      }
      // Set auth data
    };

    fetchUserData();
  }, []);

  return authData;
};
