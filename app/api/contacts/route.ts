import { authMiddleware } from '@/lib/authMiddleware';
import { Contacts } from '@/models/Contact';
import User from '@/models/User';
import { connectDB } from '@/utils/db';

export const POST = async (request: Request) => {
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

    const { username, name } = await request.json();

    await connectDB();

    const user = await User.findOne({
      username,
    });

    if (!user) {
      return Response.json(
        {
          message: 'Contact is not using chatty',
        },
        { status: 400 },
      );
    }

    const contact = await Contacts.create({
      owner_id: authUser._id,
      user_id: user._id,
      name: name,
    });

    return Response.json(contact.toObject(), { status: 201 });
  } catch (error) {
    console.log('Contact Creation Error:', error);

    const { message } = error as { message: string };

    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
