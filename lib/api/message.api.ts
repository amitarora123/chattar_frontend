import { Message, SendMessageProps } from "@/types/message.types";
import { apiClient } from "../apiClient/apiClient";

export const sendMessage = async ({ chat_id, content, attachment, reply_to }: SendMessageProps) => {
  const res = await apiClient.post(`/messages/send/${chat_id}`, { content, attachment, reply_to });
  return res.data.data;
};

export const getChatMessages = async (data: {
  chat_id: string;
  limit?: number;
  offset?: number;
}): Promise<Message[]> => {
  const { chat_id, limit, offset } = data;

  const res = await apiClient.get(`/messages/chat/${chat_id}`, {
    params: { limit, offset },
  });
  return res.data.data;
};
