import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';
import { isValidObjectId } from 'mongoose';

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ user_id: string }> },
) => {
  try {
    await connectDB();
    const { user_id } = await params;
    const { otp }: { otp: string } = await request.json();

    if (!user_id || !isValidObjectId(user_id) || !otp || otp.length !== 6) {
      return Response.json(
        {
          message: 'All fields are required',
        },
        { status: 400 },
      );
    }

    const user = (await User.findById(user_id)) as IUser;

    if (!user) {
      return Response.json(
        {
          message: 'User not found',
        },
        { status: 404 },
      );
    }

    if (!user.otp) {
      return Response.json({
        message: 'OTP Invalid or Used, Request a new one',
      });
    }

    if (user.otp.code !== otp || user.otp.expiresIn.valueOf() < Date.now()) {
      return Response.json(
        {
          message: 'Invalid or Expired otp',
        },
        { status: 400 },
      );
    }

    user.isVerified = true;
    user.otp = undefined;

    await user.save();

    return Response.json(
      {
        message: 'User verified successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error verifying user: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
