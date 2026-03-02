import { User } from './user.types';

export interface Contact {
  _id: string;
  user: User;
  name?: string;
}
