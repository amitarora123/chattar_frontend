import jwt from 'jsonwebtoken';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';

export const POST = async (request: Request) => {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return Response.json(
        {
          message: 'All Fields are required',
        },
        { status: 400 },
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      user_id: string;
    };

    if (!decoded || !decoded.user_id) {
      return Response.json(
        {
          message: 'Invalid token or expired',
        },
        { status: 400 },
      );
    }

    const user: IUser | null = await User.findById(decoded.user_id);

    if (!user) {
      return Response.json(
        {
          message: 'User does not exists',
        },
        { status: 400 },
      );
    }

    const { password_reset } = user;

    if (
      !password_reset ||
      !password_reset.token ||
      password_reset.token !== token ||
      password_reset.expiresIn <= new Date()
    ) {
      return Response.json(
        {
          message: 'Invalid or Expired token',
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.password_reset = undefined;
    await user.save();

    return Response.json(
      {
        message: 'password reset successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error in reset-password: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
