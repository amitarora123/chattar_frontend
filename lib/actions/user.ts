import { SignUpProps } from '@/types/auth.types';
import { apiClient } from '../apiClient/apiClient';
import { IUser } from '@/models/User';

export const signUp = async (data: SignUpProps) => {
  const res = await apiClient.post('/api/user/', data);
  return res.data;
};

export const getUserDetails = async (user_id: string): Promise<IUser> => {
  const res = await apiClient.get(`/api/user/${user_id}`);
  return res.data;
};

export const checkUsernameUniqueness = async (username: string) => {
  const res = await apiClient.get(`/api/user/unique/${username}`);
  return res.data;
};

export const resendVerificationOtp = async (user_id: string) => {
  const res = await apiClient.post(`/api/user/resend-otp/${user_id}`);
  return res.data;
};

export const verifyUser = async (user_id: string, otp: string) => {
  const res = await apiClient.post(`/api/user/verify/${user_id}`, {
    otp,
  });
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await apiClient.post(`/api/user/forgot-password`, {
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
  const res = await apiClient.post(`/api/user/reset-password`, {
    newPassword,
    token,
  });
  return res.data;
};

export const googleLogin = async (id_token: string) => {
  const res = await apiClient.post('/api/user/google-login', {
    id_token,
  });

  return res.data;
};
