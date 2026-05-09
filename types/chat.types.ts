export interface ChatMember {
  _id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatLastMessage {
  _id: string;
  chat: string;
  sender: ChatMember;
  content: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  name: string;
  isGroup: boolean;
  members: ChatMember[];
  lastMessage?: ChatLastMessage;
  createdAt: string;
  updatedAt: string;
}

// Used by GET /chats/recipient/:id
export interface ChatParticipant {
  user: {
    _id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    last_seen: string;
    is_active: boolean;
  };
  isContact: boolean;
  contactName: string | null;
}
