import type { NextRequest } from 'next/server';
import { connectDB } from '@/utils/db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import {
  generateExpiresIn,
  generateOtp,
  sendOtp,
} from '@/lib/service/otpService';

export const POST = async (request: NextRequest) => {
  try {
    await connectDB();
    const { username, email, password }: IUser = await request.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    const otpCode = generateOtp().toString();
    const expiresIn = generateExpiresIn();

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      otp: {
        code: otpCode,
        expiresIn,
      },
    });

    sendOtp(email, otpCode);

    return Response.json(
      {
        username,
        email,
        _id: user._id,
        createdAt: user.createdAt,
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
