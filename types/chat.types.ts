import { Message } from "./message.types";

export interface GroupMetaData {
  name: string;
  description?: string;
  avatar_url?: string;
  created_by: ChatParticipant;
}

export interface GroupRole {
  name: "Admin" | "Member";
  assigned_by: string;
}

export interface Chat {
  _id: string;
  is_group: boolean;
  participants: ChatParticipant[];
  last_message?: Message | null;
  groupMetaData?: GroupMetaData;
  unread_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  user: {
    _id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    last_seen: string;
  };
  groupRole?: GroupRole | null;
}
