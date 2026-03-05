import { authMiddleware } from '@/lib/authMiddleware';
import {
  Chat,
  ChatParticipants,
  IChatParticipants,
  IGroupRole,
} from '@/models/Chat';
import { connectDB } from '@/utils/db';

export const POST = async (request: Request) => {
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
    const { memberIds, adminIds, name, description, avatar_url } =
      await request.json();

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
      groupMetaData: {
        name,
        description,
        avatar_url,
        created_by: authUser._id,
      },
    });

    const participantsToInsert = [];

    // creator should always be admin
    participantsToInsert.push({
      chat_id: group._id,
      user_id: authUser._id!,
      groupRole: {
        assigned_by: authUser._id!,
        name: 'Admin',
      },
    });

    // other admins
    if (adminIds?.length) {
      adminIds.forEach((id: string) => {
        participantsToInsert.push({
          chat_id: group._id,
          user_id: id,
          groupRole: {
            assigned_by: authUser._id,
            name: 'Admin',
          },
        });
      });
    }

    // members
    if (memberIds?.length) {
      memberIds.forEach((id: string) => {
        participantsToInsert.push({
          chat_id: group._id,
          user_id: id,
          groupRole: {
            name: 'Member',
            assigned_by: authUser._id,
          },
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
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
