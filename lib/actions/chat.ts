import { apiClient } from '../apiClient/apiClient';

export const getMyChats = async (token: string) => {
  const res = await apiClient.get('/api/chats/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
