import { Handler } from '@netlify/functions';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { action, file, public_id } = body;

    if (action === 'upload' && file) {
      const uploadResult = await cloudinary.uploader.upload(file, {
        resource_type: 'image',
      });

      return {
        statusCode: 200,
        body: JSON.stringify(uploadResult),
      };
    }

    if (action === 'delete' && public_id) {
      const deleteResult = await cloudinary.uploader.destroy(public_id, {
        invalidate: true,
        resource_type: 'image',
      });

      return {
        statusCode: 200,
        body: JSON.stringify(deleteResult),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid parameters' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};

export { handler };
