import { authMiddleware } from '@/lib/authMiddleware';
import { Contacts } from '@/models/Contact';
import { connectDB } from '@/utils/db';
import { Request } from 'next/server';

export const GET = async (request: Request) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        {
          message: 'Unauthorized Request',
        },
        { status: 401 },
      );
    }

    await connectDB();

    const userContacts = await Contacts.find({
      owner_id: authUser._id,
    }).lean();

    return Response.json(
      {
        contacts: userContacts,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('User Contact fetching Error:', error);

    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
