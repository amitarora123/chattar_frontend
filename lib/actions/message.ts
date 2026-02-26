import { IMessageAttachment } from '@/models/Message';
import { apiClient } from '../apiClient/apiClient';

export interface SendMessageProps {
  chat_id?: string;
  content: string;
  recipient_id?: string;
  attachment?: IMessageAttachment;
  reply_to?: string;
  is_group: boolean;
}
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
