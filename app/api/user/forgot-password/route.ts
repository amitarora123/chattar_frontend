import { sendResetPasswordEmail } from '@/lib/service/emailService';
import { generateExpiresIn } from '@/lib/utils';
import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';
import jwt from 'jsonwebtoken';

export const POST = async (request: Request) => {
  try {
    const { email } = await request.json();

    if (!email)
      return Response.json(
        {
          message: 'Email is required',
        },
        { status: 400 },
      );

    await connectDB();

    const user: IUser | null = await User.findOne({
      email,
    });

    if (user) {
      const expiresIn = generateExpiresIn(15);
      const token = jwt.sign({ user_id: user._id }, process.env.JWT_SECRET!, {
        expiresIn,
      });

      user.password_reset = {
        expiresIn: new Date(expiresIn),
        token,
      };

      await user.save();

      const updatedUser = await User.findById(user._id);
      console.log(updatedUser);

      sendResetPasswordEmail(
        user.email,
        `${process.env.NEXT_PUBLIC_BASEURI}/auth/reset-password?token=${token}`,
      );
    }

    return Response.json(
      {
        message: 'If an account exists, reset link sent.',
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error in forgot-password route: ', error);
    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
