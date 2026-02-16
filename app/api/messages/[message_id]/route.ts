import { authMiddleware } from '@/lib/authMiddleware';
import { ChatParticipants } from '@/models/Chat';
import { Message } from '@/models/Message';
import { connectDB } from '@/utils/db';
import { NextRequest } from 'next/server';

// update message
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) => {
  try {
    const { content } = await request.json();
    const { message_id } = await params;

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

    const message = await Message.findOne({
      _id: message_id,
    });

    if (!message) {
      return Response.json(
        {
          message: 'Message not found',
        },
        { status: 404 },
      );
    }

    const isMessageOwner = await ChatParticipants.exists({
      _id: message.owner_id,
      user_id: authUser._id,
    });

    if (isMessageOwner) {
      return Response.json(
        {
          message: 'Not Allowed',
        },
        { status: 400 },
      );
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      message_id,
      {
        content,
      },
      { new: true },
    );

    return Response.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.log('Message Update Error: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};

// delete message
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ message_id: string }> },
) => {
  try {
    const { message_id } = await params;

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

    const message = await Message.findOne({
      _id: message_id,
    });

    if (!message) {
      return Response.json(
        {
          message: 'Message not found',
        },
        { status: 404 },
      );
    }

    const isMessageOwner = await ChatParticipants.exists({
      _id: message.owner_id,
      user_id: authUser._id,
    });

    if (isMessageOwner) {
      return Response.json(
        {
          message: 'Not Allowed',
        },
        { status: 400 },
      );
    }

    await Message.findByIdAndUpdate(message_id, {
      is_deleted: true,
    });

    return Response.json(
      {
        message: 'Message Deleted Successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Message Delete Error: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
