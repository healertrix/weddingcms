'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiLockLine, RiMailLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(`Authentication failed: ${signInError.message}`);
        return;
      }

      if (!signInData.user) {
        setError('No user data returned from authentication');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('cms_users')
        .select('role')
        .eq('id', signInData.user.id)
        .single();

      if (userError || !userData) {
        await supabase.auth.signOut();
        setError('You are not authorized to access this system. Please contact your administrator.');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <div className='flex justify-center mb-6'>
            <div className='bg-blue-100 p-4 rounded-full'>
              <RiLockLine className='w-12 h-12 text-blue-500' />
            </div>
          </div>
          <h1 className='text-3xl font-semibold mb-2'>
            Sign in to your account
          </h1>
          <p className='text-gray-600'>
            Enter your credentials below to access the dashboard.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
          <form onSubmit={handleSignIn} className='space-y-4'>
            <div>
              <label htmlFor="email" className='block text-sm font-medium text-gray-700 mb-1'>
                Email Address
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <RiMailLine className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full pl-10 pr-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                  autoComplete="email"
                  placeholder='Enter your email'
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className='block text-sm font-medium text-gray-700 mb-1'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <RiLockLine className='h-5 w-5 text-gray-400' />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full pl-10 pr-10 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  required
                  placeholder='Enter your password'
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <RiEyeOffLine className="h-5 w-5" />
                  ) : (
                    <RiEyeLine className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className='bg-red-50 text-red-500 p-3 rounded-md text-sm'>
                {error}
              </div>
            )}

            <div className='flex items-center justify-end'>
              <Link 
                href="/auth/forgot-password"
                className='text-sm text-blue-500 hover:text-blue-600'
              >
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className='w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 