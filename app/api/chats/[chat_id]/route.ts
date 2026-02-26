import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  const { chat_id } = await params;

  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    await connectDB();

    // ✅ Check if user is part of chat
    const chatParticipant = await ChatParticipants.findOne({
      chat_id,
      user_id: authUser._id,
    });

    if (!chatParticipant) {
      return Response.json(
        { message: 'Chat does not exist or access denied' },
        { status: 403 },
      );
    }

    // ✅ Fetch messages with sender populated
    const messages = await Message.find({
      chat_id,
      is_deleted: false,
    })
      .populate('sender_id', 'username avatar_url')
      .sort({ createdAt: 1 }) // optional (oldest first)
      .lean();

    // ✅ Transform to match your frontend Message interface
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      content: msg.content,
      chat_id: msg.chat_id.toString(),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      is_edited: msg.is_edited,
      is_deleted: msg.is_deleted,
      sender: {
        _id: msg.sender_id?._id?.toString(),
        username: msg.sender_id?.username,
        avatar_url: msg.sender_id?.avatar_url,
      },
    }));

    return Response.json(formattedMessages, { status: 200 });
  } catch (error) {
    console.log(`Error fetching messages for chat_id: ${chat_id}`, error);

    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};
