import { authMiddleware } from '@/lib/authMiddleware';
import { Contacts } from '@/models/Contact';
import { NextRequest } from 'next/server';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ contact_id: string }> },
) => {
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

    const { contact_id } = await params;

    const existingContact = await Contacts.findOne({
      _id: contact_id,
      owner_id: authUser._id,
    })
      .select('-__v')
      .populate({
        path: 'user_id',
        select: '-password -__v',
      })
      .lean();

    if (!existingContact) {
      return Response.json(
        {
          message: 'No Contact found by this id',
        },
        { status: 404 },
      );
    }
    const { user_id, ...rest } = existingContact;

    return Response.json({ ...rest, user: user_id }, { status: 200 });
  } catch (error) {
    console.log('Error Getting Contact:', error);
    const { message } = error as { message: string };
    return Response.json(
      {
        message: message || 'Internal Server Error',
      },
      { status: 500 },
    );
  }
};
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

    const existingContact = await Contacts.findOneAndUpdate(
      {
        _id: contact_id,
      },
      {
        $set: {
          name,
        },
      },
      {
        new: true,
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

    return Response.json(existingContact, { status: 200 });
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

    const contact = await Contacts.findOne({
      _id: contact_id,
      owner_id: authUser._id,
    });

    if (!contact) {
      return Response.json(
        {
          message: 'Contact Not Found with given id',
        },
        { status: 404 },
      );
    }

    await Contacts.deleteOne({
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
