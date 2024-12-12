import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // First, verify if the user exists
    const { data: authUser, error: fetchError } = await supabase.auth.admin.getUserById(userId);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch user details' },
        { status: 500 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // First delete from cms_users table to remove database references
    const { error: cmsError } = await supabase
      .from('cms_users')
      .delete()
      .eq('id', userId);

    if (cmsError) {
      console.error('Error deleting from cms_users:', cmsError);
      return NextResponse.json(
        { error: 'Failed to delete user from cms_users: ' + cmsError.message },
        { status: 500 }
      );
    }

    // Then delete any other potential references (like sessions)
    await supabase
      .from('auth.sessions')
      .delete()
      .eq('user_id', userId);

    // Finally delete the user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      // If auth deletion fails, we should try to rollback the cms_users deletion
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (userData.user) {
          await supabase
            .from('cms_users')
            .insert([
              {
                id: userId,
                email: userData.user.email,
                role: 'editor', // default role
                created_at: new Date().toISOString()
              }
            ]);
        }
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }

      return NextResponse.json(
        { error: 'Failed to delete auth user: ' + authError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error: any) {
    console.error('Error in delete-auth-user route:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
} 