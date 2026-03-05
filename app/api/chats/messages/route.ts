import { authMiddleware } from '@/lib/authMiddleware';
import { getChatKey } from '@/lib/service/chat';
import { Chat, ChatParticipants } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);

  const recipient_id = searchParams.get('recipient_id');
  let chat_id = searchParams.get('chat_id');

  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    await connectDB();

    if (recipient_id && !chat_id) {
      const chat_key = getChatKey(authUser._id!.toString(), recipient_id);
      const chat = await Chat.findOne({
        chat_key,
      });

      if (!chat) {
        return Response.json([], { status: 200 });
      }
      chat_id = chat._id;
    }

    //  Check if user is part of chat
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

    // Fetch messages with sender populated
    const messages = await Message.find({
      chat_id,
      is_deleted: false,
    })
      .populate('sender_id', 'username avatar_url')
      .sort({ createdAt: 1 }) // optional (oldest first)
      .lean();

    const contacts = await Contacts.find({
      owner_id: authUser._id,
    }).lean();

    const contactMap = new Map(
      contacts.map((c) => [c.user_id.toString(), c.name]),
    );

    // Transform to match your frontend Message interface
    const formattedMessages = messages.map((msg) => ({
      _id: msg._id.toString(),
      content: msg.content,
      chat_id: msg.chat_id.toString(),
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
      is_edited: msg.is_edited,
      is_deleted: msg.is_deleted,
      sender: {
        user: {
          _id: msg.sender_id?._id?.toString(),
          username: msg.sender_id?.username,
          avatar_url: msg.sender_id?.avatar_url,
        },
        isContact: contactMap.has(msg.sender_id._id.toString()),
        contactName: contactMap.get(msg.sender_id._id.toString()),
      },
    }));

    return Response.json(formattedMessages, { status: 200 });
  } catch (error) {
    console.log(`Error fetching messages for chat_id: ${chat_id}`, error);
    const { message } = error as { message: string };
    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
