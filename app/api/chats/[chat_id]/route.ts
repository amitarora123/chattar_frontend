import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Contacts } from '@/models/Contact';
import { connectDB } from '@/utils/db';
import '@/models';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  try {
    const { chat_id } = await params;

    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    await connectDB();

    // 🔹 Ensure user is participant of chat
    const chatParticipant = await ChatParticipants.findOne({
      user_id: authUser._id,
      left_at: null,
      chat_id,
    })
      .populate('chat_id')
      .lean();

    if (!chatParticipant) {
      return Response.json(
        { message: 'User is not a participant of this chat' },
        { status: 403 },
      );
    }

    const chat = chatParticipant.chat_id;

    // 🔹 Fetch all active participants
    const participants = await ChatParticipants.find({
      chat_id,
      left_at: null,
    })
      .populate({
        path: 'user_id',
        select: '_id username avatar_url',
      })
      .select('user_id role')
      .lean();

    // 🔹 Fetch contacts for current user
    const contacts = await Contacts.find({
      owner_id: authUser._id,
    })
      .select('user_id name')
      .lean();

    const contactMap = new Map(
      contacts.map((c) => [c.user_id.toString(), c.name]),
    );

    // 🔹 Format participants
    const formattedParticipants = participants
      .filter((p) => {
        // If NOT group chat → exclude auth user
        if (!chat.is_group) {
          return p.user_id._id.toString() !== authUser._id!.toString();
        }

        // If group → include everyone
        return true;
      })
      .map((p) => {
        const userId = p.user_id._id.toString();

        return {
          user: {
            _id: userId,
            username: p.user_id.username,
            avatar_url: p.user_id.avatar_url ?? null,
          },
          role: p.role,
          isContact: contactMap.has(userId),
          contactName: contactMap.get(userId) ?? null,
        };
      });

    return Response.json(
      {
        ...chat,
        participants: formattedParticipants,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Chat Fetch Error:', error);
    const { message } = error as { message?: string };

    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};

