'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { RiLoginBoxLine, RiLockLine } from 'react-icons/ri';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

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
    <div className='min-h-screen flex items-center justify-center p-10'>
      <div className='max-w-md w-full'>
        <div className='mb-8 text-center'>
          <div className='flex justify-center mb-6'>
            <div className='bg-blue-100 p-4 rounded-full'>
              <RiLockLine className='w-12 h-12 text-blue-500' />
            </div>
          </div>
          <h1 className='text-4xl font-normal mb-4'>
            Wedding Theory CMS
          </h1>
          <p className='text-gray-600 leading-relaxed'>
            Please sign in with your authorized account
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-8'>
          <form onSubmit={handleSignIn} className='space-y-6'>
            <div>
              <label htmlFor="email" className='block text-sm font-medium text-gray-700 mb-2'>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className='block text-sm font-medium text-gray-700 mb-2'>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className='bg-red-50 text-red-500 p-4 rounded-lg text-sm'>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className='w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2'
            >
              <RiLoginBoxLine className='w-5 h-5' />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Need access? Contact your administrator to get an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 