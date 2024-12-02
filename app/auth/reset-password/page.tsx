'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiLockLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isValidToken, setIsValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleHashParams = async () => {
      try {
        // Get the access_token from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');

        if (!accessToken || type !== 'recovery') {
          setMessage({
            type: 'error',
            text: 'Invalid or expired reset link. Please request a new password reset.'
          });
          return;
        }

        // Set the session with the recovery token
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: '',
        });

        if (error) {
          throw error;
        }

        // If we get here, the token is valid
        setIsValidToken(true);
        setMessage(null);

      } catch (error) {
        console.error('Error handling reset:', error);
        setMessage({
          type: 'error',
          text: 'Invalid or expired reset link. Please request a new password reset.'
        });
      }
    };

    handleHashParams();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({
        type: 'error',
        text: 'Passwords do not match.'
      });
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long.'
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Password updated successfully
      setMessage({
        type: 'success',
        text: 'Password updated successfully. Redirecting to dashboard...'
      });

      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1500);

    } catch (error: any) {
      console.error('Reset error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to reset password. Please try again.'
      });
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
            Set New Password
          </h1>
          <p className='text-gray-600'>
            Please enter your new password below.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-6 space-y-6'>
          <form onSubmit={handlePasswordReset} className='space-y-4'>
            <div>
              <label htmlFor="password" className='block text-sm font-medium text-gray-700 mb-1'>
                New Password
              </label>
              <div className='relative'>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10'
                  required
                  minLength={8}
                  placeholder='Enter new password'
                  disabled={!isValidToken}
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
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className='block text-sm font-medium text-gray-700 mb-1'>
                Confirm New Password
              </label>
              <div className='relative'>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10'
                  required
                  minLength={8}
                  placeholder='Confirm new password'
                  disabled={!isValidToken}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine className="h-5 w-5" />
                  ) : (
                    <RiEyeLine className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isValidToken}
              className='w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50'
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>

          {message?.type === 'error' && (
            <div className='text-center'>
              <Link 
                href="/auth/forgot-password"
                className='text-sm text-blue-500 hover:text-blue-600'
              >
                Request New Reset Link
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 