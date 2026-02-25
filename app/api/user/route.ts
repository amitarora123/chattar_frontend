import { connectDB } from '@/utils/db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import { sendOtp } from '@/lib/service/emailService';
import { generateExpiresIn, generateOtp } from '@/lib/utils';

export const POST = async (request: Request) => {
  try {
    await connectDB();
    const { username, email, password } = await request.json();

    if (!password || password.length < 6) {
      return Response.json(
        {
          message: 'password must be at least 6 chars',
        },
        { status: 400 },
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const otpCode = generateOtp().toString();
    const expiresIn = generateExpiresIn(5);

    const user: IUser = await User.create({
      username,
      email,
      password: hashedPassword,
      otp: {
        code: otpCode,
        expiresIn,
        resendAvailableAt: new Date(Date.now() + 60 * 1000),
      },
    });

    sendOtp(email, otpCode);

    return Response.json(
      {
        username,
        email,
        _id: user._id,
        createdAt: user.createdAt,
        isVerified: user.isVerified,
      },
      { status: 201 },
    );
  } catch (error) {
    console.log('Error registering user: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
