export interface User {
  _id: string;
  username: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  last_seen?: Date;
  otp?: {
    resendAvailableAt: string;
  };
  is_active: boolean;
}
