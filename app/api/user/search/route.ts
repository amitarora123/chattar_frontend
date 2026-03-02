import { authMiddleware } from '@/lib/authMiddleware';
import { Contacts } from '@/models/Contact';
import User from '@/models/User';
import { connectDB } from '@/utils/db';
import mongoose from 'mongoose';

export const GET = async (request: Request) => {
  try {
    const authUser = await authMiddleware(request);
    await connectDB();

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const email = searchParams.get('email');

    const query: mongoose.QueryFilter<typeof User> = {};

    if (username) {
      query.username = {
        $regex: `^${username}`,
        $options: 'i', // case-insensitive
      };
    }

    if (email) {
      query.email = {
        $regex: `^${email}`,
        $options: 'i',
      };
    }

    const users = await User.find(query)
      .select('_id username avatar_url')
      .lean(); // IMPORTANT

    let contactMap: Map<string, string> = new Map();

    if (authUser) {
      const contacts = await Contacts.find({
        owner_id: authUser._id,
      }).lean();

      contactMap = new Map(contacts.map((c) => [c.user_id.toString(), c.name]));
    }

    const response = users.map((user) => ({
      user: {
        _id: user._id.toString(),
        username: user.username,
        avatar_url: user.avatar_url ?? null,
      },
      role: undefined,
      isContact: contactMap.has(user._id.toString()) ? true : false,
      contactName: contactMap.get(user._id.toString()),
    }));

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.log('Error Searching Users', error);
    const { message } = error as { message: string };
    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
