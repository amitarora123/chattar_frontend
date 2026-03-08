import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware } from '@/lib/authMiddleware';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

export async function POST(request: Request) {
  try {
    const user = await authMiddleware(request);

    if (!user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        upload_preset: 'chat-attachments',
      },
      process.env.CLOUDINARY_APISECRET!,
    );

    return Response.json({
      timestamp,
      signature,
      api_key: process.env.CLOUDINARY_APIKEY,
      cloud_name: process.env.CLOUDINARY_CLOUDNAME,
      upload_preset: 'chat-attachments',
    });
  } catch (error) {
    console.log('Error Signing upload url: ', error);
    const { message } = error as { message: string };

    return Response.json(
      { message: message || 'Error generating signature' },
      { status: 500 },
    );
  }
}
