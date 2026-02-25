import { connectDB } from '@/utils/db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const POST = async (request: Request) => {
  try {
    await connectDB();
    const { email, password } = await request.json();

    const user: IUser | null = await User.findOne({ email });

    if (!user) {
      return Response.json(
        {
          message: 'Invalid Credentials',
        },
        { status: 400 },
      );
    }

    if (!user.password) {
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
      isVerified: user.isVerified,
    };

    const token = jwt.sign(userDetails, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    return Response.json(
      {
        ...userDetails,
        token,
        avatar_url: user.avatar_url,
      },
      { status: 201 },
    );
  } catch (error) {
    console.log('login Error', error);
    return Response.json('Internal Server Error', { status: 500 });
  }
};
