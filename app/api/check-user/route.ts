import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check in auth users
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      return NextResponse.json(
        { error: 'Failed to check auth users' },
        { status: 500 }
      );
    }

    const existingAuthUser = users?.find(user => 
      user.email?.toLowerCase() === email.toLowerCase()
    );

    // Check in cms_users
    const { data: cmsData, error: cmsError } = await supabase
      .from('cms_users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (cmsError) {
      return NextResponse.json(
        { error: 'Failed to check cms users' },
        { status: 500 }
      );
    }

    const existingCmsUser = cmsData && cmsData.length > 0 ? cmsData[0] : null;
    const existingUser = existingAuthUser || existingCmsUser;

    return NextResponse.json({
      exists: !!existingUser,
      user: existingUser ? {
        id: existingAuthUser?.id || existingCmsUser?.id,
        email: existingAuthUser?.email || existingCmsUser?.email,
        isAuthUser: !!existingAuthUser,
        isCmsUser: !!existingCmsUser,
        existsIn: existingAuthUser && existingCmsUser ? 'both' : existingAuthUser ? 'auth' : 'cms',
        cmsDetails: existingAuthUser && existingCmsUser ? {
          role: existingCmsUser.role,
          created_at: existingCmsUser.created_at
        } : null
      } : null
    });

  } catch (error: any) {
    console.error('Error in check-user route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 