import { authMiddleware } from '@/lib/authMiddleware';
import { getChatKey } from '@/lib/service/chat';
import { Chat, ChatParticipants } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
import { IMessage, Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import mongoose from 'mongoose';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  const { searchParams } = new URL(request.url);

  const recipient_id = searchParams.get('recipient_id');
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

    let chat = null;

    // 1 Try finding chat using chat_id
    if (chat_id && mongoose.Types.ObjectId.isValid(chat_id)) {
      chat = await Chat.findById(chat_id).lean();
    }

    // 2 If chat not found → try using chat_key
    if (!chat && recipient_id) {
      const chat_key = getChatKey(authUser._id!.toString(), recipient_id);

      chat = await Chat.findOne({ chat_key }).lean();
    }

    // 3 If still not found
    if (!chat) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    const chatObjectId = new mongoose.Types.ObjectId(chat._id);

    // 4 Check participant
    const chatParticipant = await ChatParticipants.findOne({
      chat_id: chatObjectId,
      user_id: authUser._id,
    }).lean();

    if (!chatParticipant) {
      return Response.json(
        { message: 'Chat does not exist or access denied' },
        { status: 403 },
      );
    }

    // 5 Build message query
    const messageQuery: mongoose.QueryFilter<IMessage> = {
      chat_id: chatObjectId,
      is_deleted: false,
    };

    // Apply cleared_at filter safely
    if (chatParticipant.cleared_at) {
      messageQuery.createdAt = { $gt: chatParticipant.cleared_at };
    }

    const messages = await Message.find(messageQuery)
      .populate('sender_id', 'username avatar_url')
      .sort({ createdAt: 1 })
      .lean();

    // 6 Fetch contacts
    const contacts = await Contacts.find(
      { owner_id: authUser._id },
      { user_id: 1, name: 1 },
    ).lean();

    const contactMap = new Map(
      contacts.map((c) => [c.user_id.toString(), c.name]),
    );

    const formattedMessages = messages.map((msg) => {
      const senderId = msg.sender_id?._id?.toString();

      return {
        _id: msg._id.toString(),
        content: msg.content,
        chat_id: msg.chat_id.toString(),
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
        is_edited: msg.is_edited,
        is_deleted: msg.is_deleted,
        sender: {
          user: {
            _id: senderId,
            username: msg.sender_id?.username,
            avatar_url: msg.sender_id?.avatar_url,
          },
          isContact: senderId ? contactMap.has(senderId) : false,
          contactName: senderId ? contactMap.get(senderId) : undefined,
        },
      };
    });

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
