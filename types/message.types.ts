import { ChatParticipant } from './chat.types';

export interface MessageAttachment {
  file_url: string;
  file_type: string;
  file_size: number;
}

export interface Message {
  _id: string;
  content: string;
  chat_id: string;
  createdAt: string;
  updatedAt: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender: ChatParticipant;
}

export interface SendMessageProps {
  chat_id?: string;
  content: string;
  recipient_id?: string;
  attachment?: MessageAttachment;
  reply_to?: string;
  is_group: boolean;
}
