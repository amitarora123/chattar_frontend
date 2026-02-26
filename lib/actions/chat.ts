import { Chat } from '@/types/chat.types';
import { apiClient } from '../apiClient/apiClient';
import { Message } from '@/types/Message.types';

export const getMyChats = async (token: string): Promise<Chat[]> => {
  const res = await apiClient.get('/api/chats/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getChatMessages = async (
  token: string,
  chat_id: string,
): Promise<Message[]> => {
  const res = await apiClient.get(`/api/chats/${chat_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
