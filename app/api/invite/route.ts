import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const { data: currentUserRole } = await supabase
      .from('cms_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!currentUserRole || currentUserRole.role !== 'admin') {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403 }
      );
    }

    // Send invitation with direct redirect to invite page
    const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
      data: {
        role: 'editor'
      },
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`
      }
    });

    if (inviteError) {
      throw inviteError;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Invitation error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
} 