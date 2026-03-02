import { authMiddleware } from '@/lib/authMiddleware';
import '@/models';
import { Contacts } from '@/models/Contact';
import User from '@/models/User';

export const GET = async (
  request: Request,
  { params }: { params: Promise<{ recipient_id: string }> },
) => {
  try {
    const { recipient_id } = await params;
    const authUser = await authMiddleware(request);
    if (!authUser) {
      return Response.json(
        {
          message: 'Unauthorized Request',
        },
        { status: 400 },
      );
    }
    const contact = await Contacts.findOne({
      owner_id: authUser._id,
      user_id: recipient_id,
    })
      .populate({
        path: 'user_id',
        select: '_id username avatar_url',
      })
      .select('name user_id')
      .lean();

    let userData;

    if (contact) {
      userData = {
        user: contact.user_id,
        isContact: true,
        contactName: contact.name,
      };
    } else {
      const user = await User.findOne({
        _id: recipient_id,
        isVerified: true,
      })
        .select('_id username avatar_url')
        .lean();

      if (!user) {
        return Response.json({ message: 'User not found' }, { status: 404 });
      }

      userData = {
        user,
        isContact: false,
        contactName: null,
      };
    }

    return Response.json(userData, { status: 200 });
  } catch (error) {
    console.log('Error initing chat: ', error);
    const { message } = error as { message: string };
    return Response.json(
      { message: message || 'Internal Server Error' },
      { status: 500 },
    );
  }
};
