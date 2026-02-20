import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
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
      left_at: null,
    })
      .populate('chat_id')
      .lean();

    const chatIds = chatParticipants.map((c) => c.chat_id._id);

    const allParticipants = await ChatParticipants.find({
      chat_id: { $in: chatIds },
      user_id: { $ne: authUser._id },
    })
      .populate('user_id')
      .lean();

    const contacts = await Contacts.find({
      owner_id: authUser._id,
    }).lean();

    const contactMap = new Map(
      contacts.map((c) => [c.user_id.toString(), c.name]),
    );

    const response = chatParticipants.map((cp) => {
      const chat = cp.chat_id;

      // GROUP CHAT
      if (chat.is_group) {
        return {
          _id: chat._id,
          name: chat.groupMetaData?.name,
          is_group: true,
          avatar: chat.groupMetaData?.avatar_url,
          created_at: chat.createdAt,
        };
      }

      // ONE-ON-ONE CHAT

      const participants = allParticipants.filter(
        (p) => p.chat_id.toString() === chat._id.toString(),
      );

      const otherUser = participants.find(
        (p) => p.user_id._id.toString() !== authUser._id!.toString(),
      );

      const displayName =
        contactMap.get(otherUser.user_id._id.toString()) ||
        otherUser.user_id.username;

      return {
        _id: chat._id,
        name: displayName,
        is_group: false,
        avatar: otherUser.user_id.avatar_url,
        created_at: chat.createdAt,
      };
    });

    return Response.json(response, { status: 200 });
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
