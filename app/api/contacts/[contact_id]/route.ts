import { authMiddleware } from '@/lib/authMiddleware';
import { ChatContacts } from '@/models/Contact';
import { NextRequest } from 'next/server';

export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ contact_id: string }> },
) => {
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

    const { contact_id } = await params;
    const { name } = await request.json();

    const existingContact = await ChatContacts.findOneAndUpdate(
      {
        _id: contact_id,
      },
      {
        $set: {
          name,
        },
      },
    ).lean();

    if (!existingContact) {
      return Response.json(
        {
          message: 'No Existing Contact found by this id',
        },
        { status: 404 },
      );
    }

    return Response.json(
      {
        ...existingContact,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log('Error updating Contact:', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ contact_id: string }> },
) => {
  try {
    const authUser = await authMiddleware(request);

    if (!authUser) {
      return Response.json(
        {
          message: 'Internal Server Error',
        },
        { status: 401 },
      );
    }

    const { contact_id } = await params;

    const contact = await ChatContacts.findOne({
      _id: contact_id,
      user_id: authUser._id,
    });

    if (!contact) {
      return Response.json(
        {
          message: 'Contact Not Found with given id',
        },
        { status: 404 },
      );
    }

    await ChatContacts.deleteOne({
      _id: contact_id,
    });

    return Response.json(
      {
        message: 'Contact Deleted Successfully',
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log('Error Deleting Contact: ', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message,
      },
      { status: 500 },
    );
  }
};
