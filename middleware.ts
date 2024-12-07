import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If there's no session and trying to access protected route
  if (!session && !req.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set(`redirectedFrom`, req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If there's a session, check if the user is authorized
  if (session && !req.nextUrl.pathname.startsWith('/auth/')) {
    const { data: userData, error } = await supabase
      .from('cms_users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // If there's an error or no user found, redirect to login
    if (error || !userData) {
      await supabase.auth.signOut();
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/auth/login';
      return NextResponse.redirect(redirectUrl);
    }

    // If trying to access /users page and not an admin, redirect to home
    if (req.nextUrl.pathname.startsWith('/users') && userData.role !== 'admin') {
      console.log('Non-admin attempting to access Users page');
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If there's a session and trying to access auth pages
  if (session && req.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}; 