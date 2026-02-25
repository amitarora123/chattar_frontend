import { sendOtp } from '@/lib/service/emailService';
import { generateExpiresIn, generateOtp, getSecondsLeft } from '@/lib/utils';
import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ user_id: string }> },
) => {
  try {
    const { user_id } = await params;

    await connectDB();

    const user: IUser | null = await User.findById(user_id);

    if (!user) {
      return Response.json(
        {
          message: 'User not found',
        },
        { status: 404 },
      );
    }

    if (user.otp && user.otp.resendAvailableAt > new Date()) {
      return Response.json({
        message: `Please Wait for ${getSecondsLeft(user.otp.resendAvailableAt)} to get next resend`,
      });
    }

    const otp = generateOtp().toString();
    const expiresIn = generateExpiresIn(5);

    user.otp = {
      code: otp,
      expiresIn: new Date(expiresIn),
      resendAvailableAt: new Date(Date.now() + 60 * 1000),
    };

    user.save();
    sendOtp(user.email, otp);

    return Response.json(
      {
        message: 'OTP Resend Successfully',
        resendAvailableAt: user.otp.resendAvailableAt,
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
