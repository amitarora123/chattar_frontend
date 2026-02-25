import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import { connectDB } from '@/utils/db';
import { NextResponse } from 'next/server';
import { generateUniqueUsername } from '@/lib/service/user';

const client = new OAuth2Client(process.env.AUTH_GOOGLE_ID);

export const POST = async (request: Request) => {
  try {
    const { id_token } = await request.json();

    if (!id_token) {
      return NextResponse.json(
        { message: 'ID token is required' },
        { status: 400 },
      );
    }

    // 1 Verify Google ID Token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.AUTH_GOOGLE_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.email_verified) {
      return NextResponse.json(
        { message: 'Invalid Google token' },
        { status: 401 },
      );
    }

    await connectDB();

    // 2 Find or Create User
    let user = await User.findOne({ email: payload.email });

    if (user && !user.avatar_url) {
      user.avatar_url = payload.picture;
      await user.save();
    }
    if (!user) {
      const baseUsername = payload.email.split('@')[0];
      const uniqueUsername = await generateUniqueUsername(baseUsername);

      user = await User.create({
        email: payload.email,
        username: uniqueUsername,
        display_name: payload.name,
        avatar_url: payload.picture,
        isVerified: true,
        is_active: true,
      });
    }

    const userDetails = {
      _id: user._id,
      username: user.username,
      email: user.email,
      isVerified: user.isVerified,
    };

    // 3 Issue Backend JWT
    const token = jwt.sign(userDetails, process.env.JWT_SECRET!, {
      expiresIn: '7d',
    });

    return NextResponse.json(
      {
        token,
        ...userDetails,
        avatar_url: user.avatar_url,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Google login error:', error);

    return NextResponse.json(
      { message: 'Authentication failed' },
      { status: 401 },
    );
  }
};
