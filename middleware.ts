import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current URL
  const url = new URL(req.url);
  const path = url.pathname;

  // Debug log
  console.log('URL:', url.toString());
  console.log('Path:', path);

  // Handle Supabase auth callback
  if (path === '/auth/callback') {
    const code = url.searchParams.get('code');
    // Handle the callback and redirect to invite page
    if (code) {
      const redirectUrl = new URL('/auth/invite', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle invitation flow
  if (path === '/auth/invite') {
    // If we have a token in query params, let it pass through
    const token = url.searchParams.get('token');
    if (token) {
      return res;
    }

    // If we have a hash, let it pass through (the client will handle it)
    if (url.hash) {
      return res;
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/invite', '/auth/login', '/auth/signup', '/auth/callback', '/auth/reset-password'];
  if (publicRoutes.includes(path)) {
    return res;
  }

  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  // For all other routes, check if user is authenticated
  if (!session) {
    const redirectUrl = new URL('/auth/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', path);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if the user exists in cms_users table
  const { data: userData } = await supabase
    .from('cms_users')
    .select('role')
    .eq('email', session.user.email)
    .single();

  // If user is authenticated but not in cms_users (hasn't completed setup)
  if (!userData && !path.startsWith('/auth/invite')) {
    const redirectUrl = new URL('/auth/invite', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Protect /users route - only allow admin access
  if (path === '/users' && userData?.role !== 'admin') {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 