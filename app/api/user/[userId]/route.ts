'use server';

import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ userId: string }> },
) => {
  const { userId } = await params;

  try {
    await connectDB();
    const user = (await User.findOne({ _id: userId })
      .select('-password')
      .lean()) as IUser;

    if (!user)
      return Response.json(
        {
          message: 'User Not Found',
        },
        { status: 404 },
      );

    return Response.json({
      ...user,
      otp: user.otp
        ? { resendAvailableAt: user.otp.resendAvailableAt }
        : undefined,
    });
  } catch (error) {
    console.log('Error while fetching user', error);
    return Response.json(
      {
        message: 'Something Went Wrong',
      },
      { status: 500 },
    );
  }
};
