import { authMiddleware } from '@/lib/authMiddleware';
import { Chat, ChatParticipants } from '@/models/Chat';
import { connectDB } from '@/utils/db';
import { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
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
    const { memberIds, adminIds, name } = await request.json();

    if (!name) {
      return Response.json(
        {
          message: 'name is required',
        },
        { status: 400 },
      );
    }
    await connectDB();

    const group = await Chat.create({
      is_group: true,
      name,
    });

    const participantsToInsert = [];

    // creator should always be admin
    participantsToInsert.push({
      chat_id: group._id,
      user_id: authUser._id,
      role: 'Admin',
    });

    // other admins
    if (adminIds?.length) {
      adminIds.forEach((id: string) => {
        participantsToInsert.push({
          chat_id: group._id,
          user_id: id,
          role: 'Admin',
        });
      });
    }

    // members
    if (memberIds?.length) {
      memberIds.forEach((id: string) => {
        participantsToInsert.push({
          chat_id: group._id,
          user_id: id,
          role: 'Member',
        });
      });
    }

    const members = await ChatParticipants.insertMany(participantsToInsert);

    return Response.json(
      {
        group,
        members,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error creating group', error);
    const { message } = error as { message: string };
    return Response.json({
      message: message || 'Internal Server Error',
    });
  }
};
