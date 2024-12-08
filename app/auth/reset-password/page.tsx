'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { RiLockLine, RiEyeLine, RiEyeOffLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  // Password validation states
  const [validations, setValidations] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    matches: false
  });

  // Validate password as user types
  useEffect(() => {
    setValidations({
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      matches: password === confirmPassword && password !== ''
    });
  }, [password, confirmPassword]);

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Get all parameters from the URL
        const code = searchParams?.get('code');
        const accessToken = searchParams?.get('access_token');
        const refreshToken = searchParams?.get('refresh_token');
        const type = searchParams?.get('type');

        // First try with code (newer Supabase versions)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) {
            setTokenStatus('valid');
            setError('');
            return;
          }
        }

        // Then try with access token (older versions or different flow)
        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (!error) {
            setTokenStatus('valid');
            setError('');
            return;
          }
        }

        // If we get here without a valid session, check if we're in recovery mode
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setTokenStatus('valid');
          setError('');
          return;
        }

        throw new Error('Invalid reset token');

      } catch (err: any) {
        console.error('Token validation error:', err);
        setTokenStatus('invalid');
        setError('This password reset link is invalid or has expired. Please request a new one.');
      }
    };

    validateToken();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (tokenStatus !== 'valid') {
      setError('Invalid reset token. Please request a new password reset link.');
      return;
    }

    // Check if all validations pass
    const allValidationsPass = Object.values(validations).every(v => v);
    if (!allValidationsPass) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess('Password updated successfully! Redirecting to login...');
      
      // Sign out and redirect after successful password reset
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);

    } catch (err: any) {
      console.error('Reset error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ValidationIcon = ({ isValid }: { isValid: boolean }) => (
    isValid ? 
      <RiCheckLine className="h-5 w-5 text-green-500" /> : 
      <RiCloseLine className="h-5 w-5 text-gray-300" />
  );

  if (tokenStatus === 'validating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="animate-pulse flex space-x-4 items-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <RiLockLine className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choose a strong password for your account
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form className="space-y-4" onSubmit={handlePasswordReset}>
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={tokenStatus !== 'valid'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <RiEyeOffLine className="h-5 w-5 text-gray-400" />
                  ) : (
                    <RiEyeLine className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={tokenStatus !== 'valid'}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine className="h-5 w-5 text-gray-400" />
                  ) : (
                    <RiEyeLine className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Password Requirements:
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center">
                  <ValidationIcon isValid={validations.hasMinLength} />
                  <span className="ml-2">At least 8 characters</span>
                </li>
                <li className="flex items-center">
                  <ValidationIcon isValid={validations.hasUpperCase} />
                  <span className="ml-2">One uppercase letter</span>
                </li>
                <li className="flex items-center">
                  <ValidationIcon isValid={validations.hasLowerCase} />
                  <span className="ml-2">One lowercase letter</span>
                </li>
                <li className="flex items-center">
                  <ValidationIcon isValid={validations.hasNumber} />
                  <span className="ml-2">One number</span>
                </li>
                <li className="flex items-center">
                  <ValidationIcon isValid={validations.matches} />
                  <span className="ml-2">Passwords match</span>
                </li>
              </ul>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <div className="flex">
                  <RiCloseLine className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="ml-2 text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-md bg-green-50 p-3">
                <div className="flex">
                  <RiCheckLine className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <p className="ml-2 text-sm text-green-700">{success}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || tokenStatus !== 'valid' || !Object.values(validations).every(v => v)}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                ${loading || tokenStatus !== 'valid' || !Object.values(validations).every(v => v)
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>

            {/* Request New Link */}
            {tokenStatus === 'invalid' && (
              <div className="text-center mt-4">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Request New Reset Link
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm">
          <div className="animate-pulse flex space-x-4 items-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 