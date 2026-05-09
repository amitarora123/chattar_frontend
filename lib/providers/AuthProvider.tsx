"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { logout, refreshAccessToken } from "../api/auth.api";
import { getMe } from "../api/user.api";
import { useRouter } from "next/navigation";
import { apiClient } from "../apiClient/apiClient";
import { clearRefreshToken, getRefreshToken, setRefreshToken } from "../auth/session";
import { User } from "@/types/user.types";

interface AuthContextValue {
  user: User | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const tokenRef = useRef<string | null>(null);
  const isRefreshing = useRef(false);
  const failedQueue = useRef<
    { resolve: (token: string) => void; reject: (err: unknown) => void }[]
  >([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: logout,
    mutationKey: ["logout"],
  });

  const refreshAccessTokenMutation = useMutation({
    mutationKey: ["refresh-access-token"],
    mutationFn: (token: string) => refreshAccessToken(token),
    onSuccess: (data) => {
      tokenRef.current = data.accessToken;
      if (data.refreshToken) setRefreshToken(data.refreshToken);
      setIsAuthenticated(true);
    },
    onError: async () => {
      clearTokens();
      await logoutMutation.mutateAsync();
      router.replace("/auth/sign-in");
    },
  });

  const { mutate: triggerRefresh } = refreshAccessTokenMutation;

  const { data: user = null } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: Infinity,
  });

  const setTokens = useCallback(
    (accessToken: string, refreshToken: string): void => {
      tokenRef.current = accessToken;
      setRefreshToken(refreshToken);
      setIsAuthenticated(true);
    },
    [],
  );

  const clearTokens = useCallback((): void => {
    tokenRef.current = null;
    setIsAuthenticated(false);
    clearRefreshToken();
  }, []);

  const processQueue = (error: unknown, newToken: string | null) => {
    failedQueue.current.forEach(({ resolve, reject }) => {
      if (error || !newToken) {
        reject(error);
      } else {
        resolve(newToken);
      }
    });
    failedQueue.current = [];
  };

  // Attach request interceptor — injects Bearer token
  useEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(
      async (config) => {
        if (tokenRef.current) {
          config.headers.Authorization = `Bearer ${tokenRef.current}`;
        }
        return config;
      },
    );

    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Attach response interceptor — handles ACCESS_TOKEN_EXPIRED
  useEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        const errorCode = error.response?.data?.code;
        const is401 = error.response?.status === 401;
        const isTokenExpired = errorCode === "ACCESS_TOKEN_EXPIRED";

        if (!is401 || !isTokenExpired || originalRequest._retry) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        if (isRefreshing.current) {
          return new Promise((resolve, reject) => {
            failedQueue.current.push({
              resolve: (newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                resolve(apiClient(originalRequest));
              },
              reject,
            });
          });
        }

        isRefreshing.current = true;

        try {
          const storedToken = getRefreshToken();
          if (!storedToken) {
            processQueue(new Error("No refresh token"), null);
            clearTokens();
            router.replace("/auth/sign-in");
            return Promise.reject(new Error("No refresh token"));
          }

          const data = await refreshAccessTokenMutation.mutateAsync(storedToken);
          const newToken = data.accessToken;

          tokenRef.current = newToken;
          if (data.refreshToken) setRefreshToken(data.refreshToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing.current = false;
        }
      },
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessTokenMutation, clearTokens, router]);

  // Initial token load on mount
  useEffect(() => {
    const token = getRefreshToken();
    if (!token) {
      router.replace("/auth/sign-in");
      return;
    }
    triggerRefresh(token);
  }, [triggerRefresh, router]);

  return (
    <AuthContext.Provider value={{ user, setTokens, clearTokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
