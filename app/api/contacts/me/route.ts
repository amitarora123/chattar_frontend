import { authMiddleware } from '@/lib/authMiddleware';
import { Contacts, IContacts } from '@/models/Contact';
import { connectDB } from '@/utils/db';

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

    const userContacts: IContacts[] = await Contacts.find({
      owner_id: authUser._id,
    })
      .populate('user_id')
      .select('-user_id.otp -user_id.password -user_id.password_reset')
      .lean();

    const formattedUserContacts = userContacts.map((c) => ({
      _id: c._id,
      name: c.name,
      user: c.user_id,
    }));
    return Response.json(formattedUserContacts, { status: 200 });
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
