import { Chat, ChatParticipant } from '@/types/chat.types';
import { apiClient } from '../apiClient/apiClient';
import { Message } from '@/types/message.types';

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
  chat_id?: string | null,
  recipient_id?: string | null,
): Promise<Message[]> => {
  const res = await apiClient.get(`/api/chats/messages`, {
    params: {
      chat_id,
      recipient_id,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const getRecipientDetails = async (
  token: string,
  recipient_id: string,
): Promise<ChatParticipant> => {
  const res = await apiClient.get(`/api/chats/recipient/${recipient_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};

export const getChatById = async (
  token: string,
  chat_id: string,
): Promise<Chat> => {
  const res = await apiClient.get(`/api/chats/${chat_id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};

export const createGroup = async (
  token: string,
  data: {
    memberIds: string[];
    adminIds: string[];
    name: string;
    description?: string;
    avatar_url?: string;
  },
) => {
  const res = await apiClient.post('/api/chats/group', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
