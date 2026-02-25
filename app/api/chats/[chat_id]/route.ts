import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import { Request } from 'next/server';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  const { chat_id } = await params;
  try {
    const authUser = await authMiddleware(request);
    if (!authUser) {
      return Response.json(
        {
          message: 'Unauthorized Request',
        },
        { status: 500 },
      );
    }

    await connectDB();

    const chatParticipant = await ChatParticipants.findOne({
      chat_id,
      user_id: authUser._id,
    });

    if (!chatParticipant) {
      return Response.json(
        {
          message: 'Chat Does not Exists or Not allowed to view the chat',
        },
        { status: 400 },
      );
    }

    const messages = await Message.find({
      chat_id,
      is_deleted: false,
    });

    return Response.json(messages, { status: 200 });
  } catch (error) {
    console.log(`Error fetching messages for chat_id: ${chat_id}`);
    const { message } = error as { message: string };
    return Response.json({ message: message || 'Internal Server Error' });
  }
};
