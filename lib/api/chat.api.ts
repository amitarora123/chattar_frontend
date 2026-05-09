import { Chat, ChatParticipant } from "@/types/chat.types";
import { apiClient } from "../apiClient/apiClient";
import { Message } from "@/types/message.types";

export const getMyChats = async (): Promise<Chat[]> => {
  const res = await apiClient.get("/chats/me");
  return res.data;
};

export const getChatMessages = async (chat_id: string): Promise<Message[]> => {
  const res = await apiClient.get(`/messages/chat/${chat_id}`);
  return res.data;
};

export const getRecipientDetails = async (
  recipient_id: string,
): Promise<ChatParticipant> => {
  const res = await apiClient.get(`/chats/recipient/${recipient_id}`);
  return res.data;
};

export const getChatById = async (chat_id: string): Promise<Chat> => {
  const res = await apiClient.get(`/chats/${chat_id}`);
  return res.data;
};

export const createDirectChat = async (recipient_id: string): Promise<Chat> => {
  const res = await apiClient.post("/chats/single", { recipient_id });
  return res.data;
};

export const createGroup = async (data: {
  memberIds: string[];
  adminIds: string[];
  name: string;
  description?: string;
  avatar_url?: string;
}) => {
  const res = await apiClient.post("/chats/group", data);
  return res.data;
};

export const clearChat = async (chat_id: string) => {
  const res = await apiClient.delete(`/chats/${chat_id}/clear`);
  return res.data;
};
