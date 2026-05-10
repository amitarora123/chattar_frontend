export interface User {
  _id: string;
  username: string;
  display_name?: string;
  email: string;
  avatar_url?: string;
  last_seen?: Date;
}

export interface UpdateMeProps {
  name?: string;
  avatar_url?: string;
  is_active?: boolean;
}
