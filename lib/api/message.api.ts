import { SendMessageProps } from "@/types/message.types";
import { apiClient } from "../apiClient/apiClient";

export const sendMessage = async ({ chat_id, content, attachment, reply_to }: SendMessageProps) => {
  const res = await apiClient.post(`/messages/send/${chat_id}`, { content, attachment, reply_to });
  return res.data;
};
