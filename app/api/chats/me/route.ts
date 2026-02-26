import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import '@/models';
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

    // 1️⃣ Get chats where user is participant
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

    // 2️⃣ Get all other participants for 1-1 chats
    const allParticipants = await ChatParticipants.find({
      chat_id: { $in: chatIds },
      user_id: { $ne: authUser._id },
    })
      .populate('user_id')
      .lean();

    // 3️⃣ Get user contacts
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

    // 5 Build final response
    const response = chatParticipants
      .map((cp) => {
        const chat = cp.chat_id;
        const lastMessage = lastMessageMap.get(chat._id.toString()) || null;

        // 🔹 GROUP CHAT
        if (chat.is_group) {
          return {
            _id: chat._id,
            name: chat.groupMetaData?.name,
            is_group: true,
            avatar: chat.groupMetaData?.avatar_url,
            createdAt: chat.createdAt,
            last_message: lastMessage,
          };
        }

        // 🔹 ONE-ON-ONE CHAT
        const participants = allParticipants.filter(
          (p) => p.chat_id.toString() === chat._id.toString(),
        );

        const otherUser = participants[0]?.user_id;

        if (!otherUser) {
          return null;
        }

        const displayName =
          contactMap.get(otherUser._id.toString()) || otherUser.username;

        return {
          _id: chat._id,
          name: displayName,
          is_group: false,
          avatar: otherUser.avatar_url,
          createdAt: chat.createdAt,
          last_message: lastMessage,
        };
      })
      .filter(Boolean);

    return Response.json(response, { status: 200 });
  } catch (error) {
    console.log('User Chats Fetching Error:', error);

    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
};
