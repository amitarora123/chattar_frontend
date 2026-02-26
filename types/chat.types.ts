import { Message } from './Message.types';

export interface Chat {
  _id: string;
  name: string;
  avatar: string;
  isGroup: boolean;
  createdAt: Date;
  last_message: Message;
}
