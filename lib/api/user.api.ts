import { RefreshAccessToken, SignUpProps } from "@/types/auth.types";
import { apiClient } from "../apiClient/apiClient";
import { User } from "@/types/user.types";
import { ChatParticipant } from "@/types/chat.types";

export const signUp = async (data: SignUpProps) => {
  const res = await apiClient.post("/user/sign-up", data);
  return res.data;
};

export const refreshAccessToken = async (): Promise<RefreshAccessToken> => {
  const res = await apiClient.post("/user/refresh", null, {
    withCredentials: true,
  });
  return res.data;
};

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get("/user/me");
  return res.data;
};

export const getUserDetails = async (user_id: string): Promise<User> => {
  const res = await apiClient.get(`/user/${user_id}`);
  return res.data;
};

export const checkUsernameUniqueness = async (username: string) => {
  const res = await apiClient.get(`/user/unique/${username}`);
  return res.data;
};

export const resendVerificationOtp = async (email: string) => {
  const res = await apiClient.post("/user/resend-otp", {
    email,
  });
  return res.data;
};

export const verifyUser = async (data: { email: string; otp: string }) => {
  const res = await apiClient.post(`/user/verify`, data);
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await apiClient.post(`/user/forgot-password`, {
    email,
  });
  return res.data;
};

export const resetPassword = async ({
  newPassword,
  token,
}: {
  newPassword: string;
  token: string;
}) => {
  const res = await apiClient.post(`/user/reset-password`, {
    newPassword,
    token,
  });
  return res.data;
};

export const searchUsers = async ({
  username,
  email,
}: {
  username?: string;
  email?: string;
}): Promise<ChatParticipant[]> => {
  const res = await apiClient.get("/user/search", {
    params: {
      ...(username && { username }),
      ...(email && { email }),
    },
  });
  return res.data;
};

export const saveUserDetails = async ({ username, email }: Partial<User>) => {
  const res = await apiClient.post("/user/search", {
    params: {
      ...(username && { username }),
      ...(email && { email }),
    },
  });
  return res.data;
};
