'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RiLockLine, RiMailLine } from 'react-icons/ri';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [debugSteps, setDebugSteps] = useState<Array<{ status: 'info' | 'error' | 'success', message: string }>>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const extractTimeFromError = (error: string): number => {
    try {
      // Look for different time formats in the error message
      const timePatterns = [
        /(\d+)\s*seconds?/i,
        /(\d+)\s*minutes?/i,
        /(\d+)\s*hours?/i,
        /wait\s*(\d+)/i,
        /(\d+)/
      ];

      for (const pattern of timePatterns) {
        const match = error.match(pattern);
        if (match && match[1]) {
          const value = parseInt(match[1]);
          // Convert to seconds if the error message mentions minutes or hours
          if (error.toLowerCase().includes('minute')) return value * 60;
          if (error.toLowerCase().includes('hour')) return value * 3600;
          return value;
        }
      }
    } catch (e) {
      console.error('Error parsing rate limit time:', e);
    }
    // Default fallback
    return 60;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset debug steps at the start
    setDebugSteps([]);
    
    if (countdown > 0) {
      setMessage({
        type: 'error',
        text: `Please wait ${countdown} seconds before requesting another reset.`
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      setDebugSteps(prev => [...prev, { status: 'info', message: `Initiating password reset for ${normalizedEmail}` }]);

      setDebugSteps(prev => [...prev, { 
        status: 'info', 
        message: `Configuring reset with redirect URL: ${window.location.origin}/auth/reset-password` 
      }]);

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        setDebugSteps(prev => [...prev, { 
          status: 'error', 
          message: `Error encountered: ${resetError.message} (${resetError.name})` 
        }]);
        
        if (resetError.message.toLowerCase().includes('rate limit') || 
            resetError.message.toLowerCase().includes('too many requests')) {
          const waitTime = extractTimeFromError(resetError.message);
          setDebugSteps(prev => [...prev, { 
            status: 'error', 
            message: `Rate limit detected. Wait time: ${waitTime} seconds` 
          }]);
          setCountdown(waitTime);
          setMessage({
            type: 'error',
            text: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
          });
        }
        // Handle user not found
        else if (resetError.message.includes('User not found')) {
          console.log('User not found error');
          setMessage({
            type: 'error',
            text: 'No account found with this email address.'
          });
        }
        // Handle other specific error cases
        else if (resetError.message.includes('security purposes')) {
          const waitTime = extractTimeFromError(resetError.message);
          console.log('Security timeout detected, wait time:', waitTime);
          setCountdown(waitTime);
          setMessage({
            type: 'error',
            text: `Please wait ${waitTime} seconds before requesting another reset.`
          });
        }
        // Handle email sending errors specifically for Resend.com
        else if (resetError.message.includes('sending') || resetError.message.includes('email')) {
          setDebugSteps(prev => [...prev, { 
            status: 'info', 
            message: 'Checking Resend.com configuration...' 
          }]);

          // Add Resend.com specific checks
          setDebugSteps(prev => [...prev, { 
            status: 'info', 
            message: 'Verifying: 1) TLS enabled 2) Domain verified 3) API key valid' 
          }]);

          setDebugSteps(prev => [...prev, { 
            status: 'info', 
            message: 'Note: Ensure sender email is verified in Resend.com dashboard' 
          }]);

          setMessage({
            type: 'error',
            text: 'Email service error. Please verify: 1) Sender email is verified in Resend 2) API key is valid 3) TLS is enabled'
          });
          return;
        }
        // Generic error handler
        else {
          console.log('Generic error:', resetError.message);
          setMessage({
            type: 'error',
            text: 'Failed to send reset email. Please try again later.'
          });
        }
        return;
      }

      setDebugSteps(prev => [...prev, { 
        status: 'success', 
        message: 'Reset email sent successfully' 
      }]);
      setMessage({
        type: 'success',
        text: 'Password reset instructions have been sent to your email.'
      });
      
    } catch (error: any) {
      setDebugSteps(prev => [...prev, { 
        status: 'error', 
        message: `Unexpected error: ${error.message}` 
      }]);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again later.'
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
            Reset Password
          </h1>
          <p className='text-gray-600'>
            Enter your email address and we'll send you instructions<br />
            to reset your password.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-6'>
          <form onSubmit={handleResetPassword} className='space-y-4'>
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
                  placeholder='Enter your registered email'
                />
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                <p>{message.text}</p>
                {message.type === 'success' && (
                  <p className="mt-2 text-sm text-gray-600">
                    Note: The email might take a few minutes to arrive. Please check your spam folder if you don't see it in your inbox.
                  </p>
                )}
              </div>
            )}

            {debugSteps.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h3>
                <div className="space-y-1">
                  {debugSteps.map((step, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <span className={`
                        ${step.status === 'error' ? 'text-red-600' : ''}
                        ${step.status === 'success' ? 'text-green-600' : ''}
                        ${step.status === 'info' ? 'text-blue-600' : ''}
                      `}>
                        {step.status === 'error' ? '❌' : step.status === 'success' ? '✅' : 'ℹ️'}
                      </span>
                      <span className={`
                        ${step.status === 'error' ? 'text-red-600' : ''}
                        ${step.status === 'success' ? 'text-green-600' : ''}
                        ${step.status === 'info' ? 'text-blue-600' : ''}
                      `}>
                        {step.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || countdown > 0}
              className='w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50'
            >
              {loading ? 'Sending...' : countdown > 0 ? `Wait ${countdown}s` : 'Send Reset Instructions'}
            </button>
          </form>

          <div className='mt-6 text-center'>
            <Link 
              href="/auth/login" 
              className='text-sm text-blue-500 hover:text-blue-600'
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 