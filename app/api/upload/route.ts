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
    // Log environment check
    const envCheck = {
      hasEndpoint: !!process.env.DIGITAL_OCEAN_SPACES_ENDPOINT,
      hasBucket: !!process.env.DIGITAL_OCEAN_SPACES_BUCKET,
      hasAccessKey: !!process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
      hasSecretKey: !!process.env.DIGITAL_OCEAN_SPACES_SECRET_KEY,
    };
    
    console.log('Environment check:', envCheck);

    // Check if any environment variables are missing
    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, hasValue]) => !hasValue)
      .map(([name]) => name.replace('has', ''));

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing configuration',
          details: `Missing required configuration: ${missingEnvVars.join(', ')}`
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const buffer = await file.arrayBuffer();
    const fileName = `testimonials/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const params = {
      Bucket: process.env.DIGITAL_OCEAN_SPACES_BUCKET || '',
      Key: fileName,
      Body: Buffer.from(buffer),
      ACL: 'public-read',
      ContentType: file.type,
    };

    console.log('Attempting upload with params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      ACL: params.ACL
    });

    const uploadResult = await s3.upload(params).promise();
    console.log('Upload successful:', uploadResult);

    const url = `https://${process.env.DIGITAL_OCEAN_SPACES_BUCKET}.${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}/${fileName}`;
    console.log('Generated URL:', url);

    return NextResponse.json({ url, key: fileName });
  } catch (error: any) {
    console.error('Upload error:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });

    let errorMessage = 'Failed to upload file';
    let details = error.message;

    if (error.code === 'NoSuchBucket') {
      errorMessage = 'Storage bucket not found';
      details = 'The specified storage bucket does not exist';
    } else if (error.code === 'AccessDenied') {
      errorMessage = 'Access denied to storage';
      details = 'Check if your access credentials are correct';
    } else if (error.code === 'NetworkingError') {
      errorMessage = 'Network error occurred';
      details = 'Check your internet connection and try again';
    } else if (error.code === 'InvalidAccessKeyId') {
      errorMessage = 'Invalid access key';
      details = 'The provided access key is not valid';
    } else if (error.code === 'SignatureDoesNotMatch') {
      errorMessage = 'Invalid credentials';
      details = 'The provided access credentials are not valid';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: details,
        code: error.code
      },
      { status: 500 }
    );
  }
} 