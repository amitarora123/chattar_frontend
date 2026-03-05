import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants, IChat } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import '@/models';
import { IUser } from '@/models/User';
import { getChatKey } from '@/lib/service/chat';

export const GET = async (request: Request) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 400 },
      );
    }

    await connectDB();

    const selfChatKey = getChatKey(
      authUser._id!.toString(),
      authUser._id!.toString(),
    );

    // 1 Get chats where user is participant
    const chatParticipants = await ChatParticipants.find({
      user_id: authUser._id,
      left_at: null,
    })
      .populate('chat_id')
      .lean();

    const chatIds = chatParticipants.map((c) => c.chat_id._id);

    if (chatIds.length === 0) {
      return Response.json([], { status: 200 });
    }

    // 2 Get all other participants for 1-1 chats
    const allParticipants = await ChatParticipants.find({
      chat_id: { $in: chatIds },
    })
      .populate('user_id')
      .lean();

    // 3 Get user contacts
    const contacts = await Contacts.find({
      owner_id: authUser._id,
    }).lean();

    const contactMap = new Map(
      contacts.map((c) => [c.user_id.toString(), c.name]),
    );

    // 4 Fetch latest message per chat (single aggregation)
    const lastMessages = await Message.aggregate([
      {
        $match: {
          chat_id: { $in: chatIds },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender_id',
          foreignField: '_id',
          as: 'sender',
        },
      },
      {
        $unwind: {
          path: '$sender',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$chat_id',
          lastMessage: {
            $first: {
              _id: '$_id',
              content: '$content',
              chat_id: '$chat_id',
              createdAt: '$createdAt',
              sender: {
                _id: '$sender._id',
                username: '$sender.username',
                avatar_url: '$sender.avatar_url',
              },
            },
          },
        },
      },
    ]);

    const lastMessageMap = new Map(
      lastMessages.map((m) => [m._id.toString(), m.lastMessage]),
    );
    const response = chatParticipants.map((cp) => {
      const chat = cp.chat_id as IChat;
      let lastMessage = lastMessageMap.get(chat._id.toString()) || null;

      if (lastMessage?.sender) {
        const senderId = lastMessage.sender._id.toString();

        lastMessage = {
          ...lastMessage,
          sender: {
            user: {
              _id: senderId,
              username: lastMessage.sender.username,
              avatar_url: lastMessage.sender.avatar_url ?? null,
            },
            groupRole: null, // Not relevant for message context
            isContact: contactMap.has(senderId),
            contactName: contactMap.get(senderId) ?? null,
          },
        };
      }
      // Get participants for this chat
      const participantsForChat = allParticipants.filter(
        (p) => p.chat_id.toString() === chat._id.toString(),
      );

      const formattedParticipants = participantsForChat
        .filter((p) => {
          // If NOT group → exclude auth user
          if (!chat.is_group && chat.chat_key != selfChatKey) {
            return p.user_id._id.toString() !== authUser._id!.toString();
          }

          // If group → include everyone
          return true;
        })
        .map((p) => {
          const user = p.user_id as IUser;

          return {
            user: {
              _id: user._id.toString(),
              username: user.username,
              avatar_url: user.avatar_url ?? null,
            },
            groupRole: p.groupRole,
            isContact: contactMap.has(user._id.toString()),
            contactName: contactMap.get(user._id.toString()) ?? null,
          };
        });

      return {
        _id: chat._id.toString(),
        is_group: chat.is_group,
        groupMetaData: chat.is_group ? chat.groupMetaData : undefined,
        last_message: lastMessage,
        participants: formattedParticipants,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });
    return Response.json(response, { status: 200 });
  } catch (error) {
    console.log('User Chats Fetching Error:', error);
    const { message } = error as { message: string };
    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
