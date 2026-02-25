'use server';

import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) => {
  const { username } = await params;

  try {
    await connectDB();
    const user = (await User.findOne({ username })
      .select('-password')
      .lean()) as IUser;

    return Response.json(!user, { status: 200 });
  } catch (error) {
    console.log('Error while fetching username', error);

    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Something Went Wrong',
      },
      { status: 500 },
    );
  }
};
