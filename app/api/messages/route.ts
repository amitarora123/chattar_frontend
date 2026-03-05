import { authMiddleware } from '@/lib/authMiddleware';
import { Chat, ChatParticipants, IChat } from '@/models/Chat';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import { getChatKey } from '@/lib/service/chat';
import { isValidObjectId } from 'mongoose';
import { getIO } from '@/lib/socket/socketServer';

export const POST = async (request: Request) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    const { chat_id, recipient_id, content, attachment, reply_to, is_group } =
      await request.json();

    await connectDB();

    let chat: IChat | null = null;

    // if this is a group
    if (is_group) {
      // we didn't go the valid chat_id
      if (!chat_id || !isValidObjectId(chat_id)) {
        return Response.json(
          {
            message: 'chat_id is required for group',
          },
          { status: 400 },
        );
      }

      // we got the valid chat_id
      chat = await Chat.findOne({
        _id: chat_id,
        is_group: true,
      });
    } else {
      // there are 2 things

      // 1. we didn't got valid chat_id

      if (!chat_id || !isValidObjectId(chat_id)) {
        // 1.1 and we didn't got the valid recipient_id

        if (!recipient_id || !isValidObjectId(recipient_id)) {
          // return error
          return Response.json(
            {
              message: 'recipient_id is required to create chat',
            },
            { status: 400 },
          );
        }
        // we got the valid recipient_id

        // sorted unique chat_key for one on one chat
        const chat_key = getChatKey(authUser._id!.toString(), recipient_id);

        // checking if chat exists or not
        chat = await Chat.findOne({
          chat_key,
          is_group: false,
        });

        if (!chat) {
          // ONE ON ONE CHAT CREATION
          chat = (await Chat.create({
            chat_key,
          })) as IChat;

          // create chat participants

          // making current user a chat participant
          await ChatParticipants.create({
            chat_id: chat._id,
            user_id: authUser._id,
          });

          // making other user a chat participant if it is not a self chat
          if (recipient_id != authUser._id) {
            await ChatParticipants.create({
              chat_id: chat._id,
              user_id: recipient_id,
            });
          }
        }
      }
      // we got the valid chat_id
      else {
        chat = await Chat.findById(chat_id);
      }
    }

    // EXISTING CHAT (GROUP OR ONE TO ONE)

    if (!chat) {
      return Response.json({ message: 'Chat not found' }, { status: 404 });
    }

    // verify membership
    const isMember = await ChatParticipants.exists({
      chat_id: chat._id,
      user_id: authUser._id,
    });

    if (!isMember) {
      return Response.json(
        { message: 'Not allowed in this chat' },
        { status: 403 },
      );
    }

    // CREATE MESSAGE
    const message = await Message.create({
      chat_id: chat._id,
      sender_id: authUser._id,
      content: content || '',
      reply_to_id: isValidObjectId(reply_to) ? reply_to : undefined,
      attachment: attachment,
    });

    await message.populate('sender_id', 'username avatar_url');
    const io = getIO();

    const formattedMessage = {
      _id: message._id.toString(),
      content: message.content,
      chat_id: message.chat_id.toString(),
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      is_edited: message.is_edited,
      is_deleted: message.is_deleted,
      sender: {
        user: {
          _id: message.sender_id?._id?.toString(),
          username: message.sender_id?.username,
          avatar_url: message.sender_id?.avatar_url,
        },
        isContact: false, // you can compute this later
        contactName: null,
      },
    };
    if (chat.is_group) {
      io.to(`chat:${chat._id}`).emit('message:new', formattedMessage);
    } else {
      const chatKey = chat.chat_key;
      io.to(`chat:${chatKey}`).emit('message:new', formattedMessage);
    }

    return Response.json(
      {
        message: 'Message sent successfully',
        data: message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    const { message } = error as { message: string };
    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
