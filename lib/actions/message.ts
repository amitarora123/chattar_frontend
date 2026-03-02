import { SendMessageProps } from '@/types/message.types';
import { apiClient } from '../apiClient/apiClient';


export const sendMessage = async (token: string, data: SendMessageProps) => {
  const res = await apiClient.post(
    '/api/messages',
    {
      ...data,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return res.data;
};
