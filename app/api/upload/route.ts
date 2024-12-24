import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://weddingtheorycms.in/',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
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
  return new NextResponse(null, { 
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    }
  });
}

export async function POST(request: Request) {
  // Add response headers with proper content type
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  try {
    // Handle OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: responseHeaders
      });
    }

    // Log request details
    console.log('Request method:', request.method);
    console.log('Request origin:', request.headers.get('origin'));

    // Check environment variables
    const envCheck = {
      hasEndpoint: !!process.env.DIGITAL_OCEAN_SPACES_ENDPOINT,
      hasBucket: !!process.env.DIGITAL_OCEAN_SPACES_BUCKET,
      hasAccessKey: !!process.env.DIGITAL_OCEAN_SPACES_ACCESS_KEY,
      hasSecretKey: !!process.env.DIGITAL_OCEAN_SPACES_SECRET_KEY,
    };
    
    const missingEnvVars = Object.entries(envCheck)
      .filter(([_, hasValue]) => !hasValue)
      .map(([name]) => name.replace('has', ''));

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required configuration',
          details: missingEnvVars.join(', ')
        },
        { 
          status: 500,
          headers: responseHeaders
        }
      );
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      console.error('FormData parsing error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to parse form data',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { 
          status: 400,
          headers: responseHeaders
        }
      );
    }

    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { 
          status: 400,
          headers: responseHeaders
        }
      );
    }

    // Log file details
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
      CacheControl: 'max-age=31536000'
    };

    const uploadResult = await s3.upload(params).promise();
    
    // Construct the URL
    const url = `https://${process.env.DIGITAL_OCEAN_SPACES_BUCKET}.${process.env.DIGITAL_OCEAN_SPACES_ENDPOINT}/${fileName}`;
    console.log('Generated URL:', url);

    // Return success response
    return NextResponse.json(
      { 
        key: fileName,
        url: url
      },
      { 
        status: 200,
        headers: responseHeaders
      }
    );

  } catch (error: any) {
    console.error('Upload error:', error);

    let errorMessage = 'Failed to upload file';

    if (error.code === 'NoSuchBucket') {
      errorMessage = 'Storage bucket not found';
    } else if (error.code === 'AccessDenied') {
      errorMessage = 'Access denied to storage';
    } else if (error.code === 'NetworkingError') {
      errorMessage = 'Network error occurred';
    } else if (error.code === 'InvalidAccessKeyId') {
      errorMessage = 'Invalid access key';
    } else if (error.code === 'SignatureDoesNotMatch') {
      errorMessage = 'Invalid credentials';
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        details: error.message || 'Unknown error occurred'
      },
      { 
        status: 500,
        headers: responseHeaders
      }
    );
  }
} 