"use client";
import { useMutation } from "@tanstack/react-query";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { logout, refreshAccessToken } from "../api/auth.api";
import { useRouter } from "next/navigation";
import { apiClient } from "../apiClient/apiClient";
import { User } from "@/types/user.types";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  setAccessToken: (accessToken: string) => void;
  clearTokens: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const isRefreshing = useRef(false);
  const failedQueue = useRef<
    { resolve: (token: string) => void; reject: (err: unknown) => void }[]
  >([]);

  // Blocks all non-auth requests until the initial token refresh completes
  const initPromiseRef = useRef<Promise<void> | undefined>(undefined);
  const resolveInitRef = useRef<(() => void) | undefined>(undefined);
  if (!initPromiseRef.current) {
    initPromiseRef.current = new Promise<void>((resolve) => {
      resolveInitRef.current = resolve;
    });
  }

  const router = useRouter();

  const logoutMutation = useMutation({
    mutationFn: logout,
    mutationKey: ["logout"],
  });

  const refreshAccessTokenMutation = useMutation({
    mutationKey: ["refresh-access-token"],
    mutationFn: () => refreshAccessToken(),
    onSuccess: (data) => {
      const { accessToken, ...userData } = data;
      tokenRef.current = accessToken;
      setUser(userData);
      setIsLoading(false);
      resolveInitRef.current?.();
    },
    onError: async (error) => {
      setIsLoading(false);
      console.log("error in refreshing the token: ", error);
      resolveInitRef.current?.();
      clearTokens();
      await logoutMutation.mutateAsync();
      router.replace("/auth/sign-in");
    },
  });

  const { mutate: triggerRefresh } = refreshAccessTokenMutation;

  const setAccessToken = useCallback((accessToken: string): void => {
    tokenRef.current = accessToken;
  }, []);

  const clearTokens = useCallback((): void => {
    tokenRef.current = null;
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
  useLayoutEffect(() => {
    const requestInterceptor = apiClient.interceptors.request.use(async (config) => {
      const isAuthRoute = config.url?.includes("/auth/");
      if (!isAuthRoute) await initPromiseRef.current;
      if (tokenRef.current) {
        config.headers.Authorization = `Bearer ${tokenRef.current}`;
      }
      return config;
    });

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
          const data = await refreshAccessTokenMutation.mutateAsync();
          const newToken = data.accessToken;

          tokenRef.current = newToken;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing.current = false;
        }
      }
    );

    return () => {
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessTokenMutation, clearTokens, router]);

  // Initial token load on mount — always attempt refresh; cookie is sent automatically
  useEffect(() => {
    triggerRefresh();
  }, [triggerRefresh]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setAccessToken, clearTokens }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
