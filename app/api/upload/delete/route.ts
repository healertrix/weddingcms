import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  endpoint: `https://${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}`,
  accessKeyId: process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DIGITAL_OCEAN_SPACES_SECRET_KEY,
  region: process.env.DIGITAL_OCEAN_SPACES_REGION,
  signatureVersion: 'v4',
  s3ForcePathStyle: false
});

export async function POST(request: Request) {
  try {
    const { imageKey } = await request.json();
    
    if (!imageKey) {
      return NextResponse.json(
        { error: 'No image key provided' },
        { status: 400 }
      );
    }

    // Extract the key from the full URL if needed
    const key = imageKey.includes('https://') 
      ? imageKey.split('/').slice(-2).join('/') // Gets "testimonials/filename"
      : imageKey;

    const params = {
      Bucket: process.env.DIGITAL_OCEAN_SPACES_BUCKET || '',
      Key: key,
    };

    await s3.deleteObject(params).promise();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete image',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 