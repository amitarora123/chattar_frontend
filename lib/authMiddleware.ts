import { IUser } from '@/models/User';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export const authMiddleware = async (
  request: NextRequest,
): Promise<Partial<IUser> | void> => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as Partial<IUser>;

    return decoded;
  } catch (error) {
    console.log('Auth Middleware Error', error);
  }
};
