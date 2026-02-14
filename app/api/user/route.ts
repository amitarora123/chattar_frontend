import type { NextRequest } from 'next/server';
import { connectDB } from '@/utils/db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';

export const POST = async (request: NextRequest) => {
  try {
    await connectDB();
    const { username, email, password }: IUser = await request.json();

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });


    return Response.json({
      username,
      email,
      _id: user._id,
      createdAt: user.createdAt
    }, { status: 201 });
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
