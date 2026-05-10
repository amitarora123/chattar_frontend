export interface SignUpProps {
  username: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  _id: string;
  username: string;
  email: string;
  isVerified: false;
  createdAt: string;
}

export interface SignInProps {
  email: string;
  password: string;
}

export interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  avatar_url: string;
}

export interface GoogleLoginProps {
  id_token: string;
}

export interface ResetPasswordProps {
  token: string;
  newPassword: string;
}

export interface VerifyOtpProps {
  otp: string;
  email: string;
}

export interface ResendOtpResponse {
  message: string;
  resendAvailableAt: string;
}

export interface RefreshAccessToken {
  accessToken: string;
  refreshToken: string;
  _id: string;
  username: string;
  email: string;
  avatar_url?: string;
}
