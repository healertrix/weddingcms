import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://weddingcms.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json'
};

const s3 = new AWS.S3({
  endpoint: `https://${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}`,
  accessKeyId: process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DIGITAL_OCEAN_SPACES_SECRET_KEY,
  region: process.env.DIGITAL_OCEAN_SPACES_REGION,
  signatureVersion: 'v4',
  s3ForcePathStyle: false
});

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { headers: corsHeaders });
  }

  try {
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request origin:', request.headers.get('origin'));

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
        { 
          status: 500,
          headers: corsHeaders
        }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('FormData parsing error:', error);
      return NextResponse.json(
        { error: 'Invalid form data', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 400, headers: corsHeaders }
      );
    }

    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    const buffer = await file.arrayBuffer();
    const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

    const params = {
      Bucket: process.env.DIGITAL_OCEAN_SPACES_BUCKET || '',
      Key: fileName,
      Body: Buffer.from(buffer),
      ACL: 'public-read',
      ContentType: file.type,
      CacheControl: 'max-age=31536000', // 1 year cache
    };

    console.log('Attempting upload with params:', {
      Bucket: params.Bucket,
      Key: params.Key,
      ContentType: params.ContentType,
      ACL: params.ACL
    });

    const uploadResult = await s3.upload(params).promise();
    console.log('Upload successful:', uploadResult);

    // Construct the URL using the bucket and endpoint
    const url = `https://${process.env.DIGITAL_OCEAN_SPACES_BUCKET}.${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}/${fileName}`;
    console.log('Generated URL:', url);

    // Return both the key and URL in a consistent format
    return NextResponse.json(
      { 
        key: fileName,
        url: url
      },
      { headers: corsHeaders }
    );

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
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
} 