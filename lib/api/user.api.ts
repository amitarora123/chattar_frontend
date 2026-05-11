import { apiClient } from "../apiClient/apiClient";
import { User, UpdateMeProps } from "@/types/user.types";
import { ChatParticipant } from "@/types/chat.types";

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

export const updateMe = async ({ name, avatar_url, is_active }: UpdateMeProps) => {
  const res = await apiClient.patch("/user/me", {
    name,
    avatar_url,
    is_active,
  });
  return res.data;
};
