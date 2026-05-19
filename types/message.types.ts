import { User } from "./user.types";

export type Sender = Pick<User, "_id" | "avatar_url" | "username">;

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  _id: string;
  chat_id: string;
  sender: Sender;
  content: string;
  attachment?: MessageAttachment;
  createdAt: string;
  updatedAt: string;
  is_edited: boolean;
  is_deleted: boolean;
  seen: MessageSeen[];
  reply_to?: ReplyMessage | null;
  reactions?: MessageReaction[];
  isPending?: boolean;
}

export interface MessageAttachment {
  file_url: string;
  file_type: string;
  file_size: number;
  file_name: string;
}
export interface SendMessageProps {
  chat_id: string;
  content: string;
  attachment?: MessageAttachment;
  reply_to?: string;
}

export interface MessageSeen {
  user_id: string;
  viewed_at: string;
}

export interface ReplyMessage {
  _id: string;
  content: string;
  is_deleted: boolean;
  attachment?: MessageAttachment | null;
  sender: Sender;
}
