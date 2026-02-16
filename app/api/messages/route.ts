import { authMiddleware } from '@/lib/authMiddleware';
import { Chat, ChatParticipants, IChat } from '@/models/Chat';
import {
  IMessageAttachments,
  Message,
  MessageAttachment,
} from '@/models/Message';
import { NextRequest } from 'next/server';
import { connectDB } from '@/utils/db';
import { getChatKey } from '@/lib/service/chat';
import { isValidObjectId } from 'mongoose';

export const POST = async (request: NextRequest) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        { message: 'Unauthorized Request' },
        { status: 401 },
      );
    }

    const {
      chat_id,
      recipient_id,
      content,
      attachment,
      reply_to,
      is_group,
      name,
    } = await request.json();

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
            name,
          })) as IChat;

          // create chat participants
          await ChatParticipants.insertMany([
            {
              chat_id: chat._id,
              user_id: authUser._id,
            },
            {
              chat_id: chat._id,
              user_id: recipient_id,
            },
          ]);
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

    // GET SENDER PARTICIPANT RECORD

    const senderParticipant = await ChatParticipants.findOne({
      chat_id: chat._id,
      user_id: authUser._id,
    });

    if (!senderParticipant) {
      return Response.json(
        { message: 'Participant record not found' },
        { status: 404 },
      );
    }

    let messageAttachment: IMessageAttachments | null = null;

    if (attachment) {
      messageAttachment = await MessageAttachment.create({
        file_url: attachment.file_url,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
      });
    }
    // CREATE MESSAGE
    const message = await Message.create({
      chat_id: chat._id,
      sender_id: senderParticipant._id,
      content: content || '',
      reply_to_id: reply_to || null,
      message_type: attachment ? 'media' : 'text',
      attachment_id: messageAttachment ? messageAttachment._id : null,
    });

    // HANDLE ATTACHMENT (IF EXISTS)

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
