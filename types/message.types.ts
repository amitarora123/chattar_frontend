import { ChatParticipant } from "./chat.types";

export interface MessageAttachment {
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface Message {
  _id: string;
  chat_id: string;
  sender: ChatParticipant;
  content: string;
  attachment?: MessageAttachment;
  createdAt: string;
  updatedAt: string;
  is_edited: boolean;
  is_deleted: boolean;
}

export interface SendMessageProps {
  chat_id: string;
  content: string;
  attachment?: MessageAttachment;
  reply_to?: string;
}
