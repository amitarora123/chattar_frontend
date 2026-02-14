import { authMiddleware } from '@/lib/authMiddleware';
import { ChatContacts } from '@/models/Contact';
import User from '@/models/User';
import { connectDB } from '@/utils/db';
import { NextRequest } from 'next/server';

export const POST = async (request: NextRequest) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        {
          message: 'Invalid Token',
        },
        { status: 401 },
      );
    }

    const { email, name } = await request.json();

    await connectDB();

    const contactUser = await User.findOne({
      email,
    });

    if (!contactUser) {
      return Response.json(
        {
          message: 'Contact is not using chatty',
        },
        { status: 400 },
      );
    }

    const chatContact = await ChatContacts.create({
      user_id: authUser._id,
      contact_id: contactUser._id,
      name: name,
    });

    return Response.json(
      {
        ...chatContact.toObject(),
      },
      { status: 201 },
    );
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


