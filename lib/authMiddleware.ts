import { IUser } from '@/models/User';
import jwt from 'jsonwebtoken';

export const authMiddleware = async (
  request: Request,
): Promise<Partial<IUser> | null> => {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return null;
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!,
    ) as Partial<IUser>;

    return decoded;
  } catch (error) {
    console.log('Auth Middleware Error', error);
    return null;
  }
};
