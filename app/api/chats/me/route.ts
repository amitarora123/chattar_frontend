import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { connectDB } from '@/utils/db';
import { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        {
          message: 'Unauthorized Request',
        },
        { status: 400 },
      );
    }

    await connectDB();

    const chatParticipants = await ChatParticipants.find({
      user_id: authUser._id,
    })
      .select('-_id -user_id -__v')
      .populate('chat_id')
      .lean();

    const chatParticipantsResponse = chatParticipants.map((c) => ({
      _id: c.chat_id._id,
      name: c.chat_id.name,
      is_group: c.chat_id.is_group,
      joined_at: c.createdAt,
      created_at: c.chat_id.createdAt,
    }));

    return Response.json(chatParticipantsResponse, { status: 200 });
  } catch (error) {
    console.log('User Chats Fetching Error:', error);
    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
