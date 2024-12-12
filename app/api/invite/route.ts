import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('cms_users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Invite the user using admin API
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/invite`,
        data: {
          role: 'editor'
        }
      }
    );

    if (error) {
      console.error('Error inviting user:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Create user record in cms_users table
    const { error: insertError } = await supabase
      .from('cms_users')
      .insert([
        {
          id: data.user.id,
          email: email,
          role: 'editor',
          created_at: new Date().toISOString()
        }
      ]);

    if (insertError) {
      console.error('Error creating cms user:', insertError);
      // Try to clean up the invited auth user if cms_users creation fails
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully'
    });

  } catch (error: any) {
    console.error('Error in invite route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 