import { ChatMember } from "./chat.types";

export interface MessageAttachment {
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface Message {
  _id: string;
  chat: string;
  sender: ChatMember;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageProps {
  chat_id: string;
  content: string;
  attachment?: MessageAttachment;
  reply_to?: string;
}
