export interface Message {
  _id: string;
  content: string;
  chat_id: string;
  createdAt: string;
  updatedAt: string;
  is_edited: boolean;
  is_deleted: boolean;
  sender: {
    _id: string;
    username: string;
    avatar_url: string;
  };
}
