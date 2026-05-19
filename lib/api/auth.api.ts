import {
  AuthResponse,
  GoogleLoginProps,
  RefreshAccessToken,
  ResendOtpResponse,
  ResetPasswordProps,
  SignInProps,
  SignUpProps,
  SignUpResponse,
  VerifyOtpProps,
} from "@/types/auth.types";
import { apiClient } from "../apiClient/apiClient";

export const signUp = async (data: SignUpProps): Promise<SignUpResponse> => {
  const res = await apiClient.post("/auth/sign-up", data);
  return res.data;
};

export const signIn = async (data: SignInProps): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/login", data);
  return res.data;
};

export const googleLogin = async (data: GoogleLoginProps): Promise<AuthResponse> => {
  const res = await apiClient.post("/auth/google-login", data);
  return res.data;
};

export const forgotPassword = async (email: string): Promise<void> => {
  const res = await apiClient.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (data: ResetPasswordProps): Promise<void> => {
  const res = await apiClient.post("/auth/reset-password", data);
  return res.data;
};

export const verifyUser = async (data: VerifyOtpProps): Promise<void> => {
  const res = await apiClient.post("/auth/verify", data);
  return res.data;
};

export const resendOtp = async (email: string): Promise<ResendOtpResponse> => {
  const res = await apiClient.post("/auth/resend-otp", { email });
  return res.data;
};

export const refreshAccessToken = async (): Promise<RefreshAccessToken> => {
  const res = await apiClient.post("/auth/refresh");
  return res.data;
};

export const logout = async (): Promise<void> => {
  const res = await apiClient.post("/auth/logout");
  return res.data;
};
