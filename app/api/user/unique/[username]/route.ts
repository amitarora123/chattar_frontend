'use server';

import User, { IUser } from '@/models/User';
import { connectDB } from '@/utils/db';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) => {
  const { username } = await params;

  try {
    await connectDB();
    const user = (await User.findOne({ username })
      .select('-password')
      .lean()) as IUser;

    return NextResponse.json(!user, { status: 200 });
    
  } catch (error) {
    console.log('Error while fetching username', error);

    const { message } = error as { message: string };

    return NextResponse.json(
      {
        message: message || 'Something Went Wrong',
      },
      { status: 500 },
    );
  }
};
