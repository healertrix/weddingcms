'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiUserAddLine } from 'react-icons/ri';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        router.push('/auth/verify-email');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-10'>
      <div className='max-w-md w-full'>
        <div className='mb-8 text-center'>
          <h1 className='text-4xl font-normal mb-4'>
            Create an Account
          </h1>
          <p className='text-gray-600 leading-relaxed'>
            Join Wedding Theory CMS to start managing your content
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-8'>
          <form onSubmit={handleSignUp} className='space-y-6'>
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
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className='block text-sm font-medium text-gray-700 mb-2'>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className='w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                required
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
              <RiUserAddLine className='w-5 h-5' />
              <span>{loading ? 'Creating account...' : 'Create Account'}</span>
            </button>
          </form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link href="/auth/login" className='text-blue-500 hover:text-blue-600'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 