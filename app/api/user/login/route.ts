import type { NextRequest } from 'next/server';
import { connectDB } from '@/utils/db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const POST = async (request: NextRequest) => {
  try {
    await connectDB();
    const { email, password }: IUser = await request.json();

    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      return Response.json(
        {
          message: 'Invalid Credentials',
        },
        { status: 400 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return Response.json(
        {
          message: 'Invalid Credentials',
        },
        { status: 400 },
      );
    }

    const userDetails = {
      _id: user._id,
      username: user.username,
      email: user.email,
    };

    const token = jwt.sign(userDetails, process.env.JWT_SECRET!);

    return Response.json(
      {
        ...userDetails,
        token,
      },
      { status: 201 },
    );
  } catch (error) {
    console.log('login Error', error);
    return Response.json('Internal Server Error', { status: 500 });
  }
};
