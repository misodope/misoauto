import { useEffect, useState } from "react";
import { useAuthContext } from "./useAuth";
import { getApiUrl } from "../utils/env";

interface FetchProps {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | null | undefined;
}

export const useFetch = (props: FetchProps) => {
  console.log("Use Fetch Invoked", props);
  const { isLoggedIn } = useAuthContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const [data, setData] = useState<any>();

  useEffect(() => {
    if (isLoggedIn) {
      (async () => {
        setLoading(true);

        try {
          const fetchConfig: RequestInit = {
            method: props.method,
            mode: "cors",
            body: props.body ?? null,
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          };

          const apiUrl = getApiUrl();
          const response = await fetch(apiUrl + props.url, fetchConfig);

          if (!response.ok) {
            throw new Error(
              `Network response was not ok:  ${response?.statusText}`,
            );
          }

          const data = await response.json();
          /*
            Example API Response:       
            {
              message,
              response,
            },
          */
          setData(data.response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [isLoggedIn]);

  return {
    data,
    loading,
    error,
  };
};
