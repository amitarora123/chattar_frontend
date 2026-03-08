import { authMiddleware } from '@/lib/authMiddleware';
import { getChatKey } from '@/lib/service/chat';
import { Chat, ChatParticipants, IChatParticipants } from '@/models/Chat';
import mongoose from 'mongoose';

export const DELETE = async (
  request: Request,
  { params }: { params: Promise<{ chat_id: string }> },
) => {
  try {
    const { chat_id } = await params;

    const { searchParams } = new URL(request.url);
    const recipient_id = searchParams.get('recipient_id');

    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    let chat = null;

    // 1 Try finding chat using chat_id
    if (chat_id && mongoose.Types.ObjectId.isValid(chat_id)) {
      chat = await Chat.findById(chat_id);
    }

    // 2 If not found and recipient_id exists → find using chat_key
    if (!chat && recipient_id) {
      const chat_key = getChatKey(authUser._id!.toString(), recipient_id);

      chat = await Chat.findOne({
        chat_key,
      });
    }

    // 3 If still no chat → return 404
    if (!chat) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    // 4 Check participant
    const chatParticipant: IChatParticipants | null =
      await ChatParticipants.findOne({
        chat_id: chat._id,
        user_id: authUser._id,
      });

    if (!chatParticipant) {
      return Response.json(
        { message: 'Chat not found or access denied' },
        { status: 403 },
      );
    }

    // 5 Clear chat
    chatParticipant.cleared_at = new Date();

    await chatParticipant.save();

    return Response.json(
      {
        message: 'Chat Cleared Successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Chat Clear Error:', error);

    const { message } = error as { message?: string };

    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
