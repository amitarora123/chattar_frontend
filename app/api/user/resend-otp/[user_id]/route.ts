import {
  generateExpiresIn,
  generateOtp,
  sendOtp,
} from '@/lib/service/otpService';
import User from '@/models/User';
import { NextRequest } from 'next/server';

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> },
) => {
  try {
    const { user_id } = await params;

    const otp = generateOtp().toString();
    const expiresIn = generateExpiresIn();

    const user = await User.findByIdAndUpdate(user_id, {
      otp: {
        code: otp,
        expiresIn,
      },
    });

    if (!user) {
      return Response.json(
        {
          message: 'User not found',
        },
        { status: 404 },
      );
    }
    sendOtp(user.email, otp);

    return Response.json(
      {
        message: 'OTP Resend Successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error resending otp: ', error);
    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
