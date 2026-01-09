'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { RiLockLine, RiShieldCheckLine } from 'react-icons/ri';

// Wrapper component just for searchParams
function SearchParamsWrapper({ children }: { children: (params: ReturnType<typeof useSearchParams>) => React.ReactNode }) {
  const searchParams = useSearchParams();
  return <>{children(searchParams)}</>;
}

export default function SetupPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const setupSession = async (searchParams: ReturnType<typeof useSearchParams>) => {
    try {
      // First check URL hash for tokens (Supabase redirects often include tokens in hash)
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken) {
          // Try to set the session with the tokens from hash
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (!sessionError) {
            return; // Session set successfully
          }
        }
      }

      // If no valid session from hash, check query parameters
      const token = searchParams.get('token');
      if (token) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'invite'
        });

        if (!verifyError) {
          return; // Token verified successfully
        }
      }

      // Check if we already have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user already has a cms_users record
        const { data: userData, error: userError } = await supabase
          .from('cms_users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (userData) {
          // User already has a cms_users record, redirect to home
          router.push('/');
          return;
        }
        return; // No cms_users record, continue with setup
      }

      // If we get here, no valid token was found
      throw new Error('No valid invitation token found. Please request a new invitation.');

    } catch (error: any) {
      console.error('Setup error:', error);
      setError(error.message || 'Failed to setup session');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // Get the user data after password update
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Create cms_user entry
        const { error: dbError } = await supabase
          .from('cms_users')
          .insert([
            {
              id: user.id,
              email: user.email,
              role: 'editor'
            }
          ]);

        if (dbError) throw dbError;
      }

      // Sign out after setup
      await supabase.auth.signOut();

      // Redirect to login page
      router.push('/auth/login?message=Account setup complete. Please log in with your new credentials.');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FF] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-sm">
        <Suspense fallback={<div>Loading...</div>}>
          <SearchParamsWrapper>
            {(searchParams) => {
              // Run setup when searchParams are available
              useEffect(() => {
                setupSession(searchParams);
              }, [searchParams]);

              return (
                <>
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#EBF5FF] mb-6">
                      <RiShieldCheckLine className="h-8 w-8 text-[#0066FF]" />
                    </div>
                    <h2 className="text-[28px] font-normal text-gray-900 mb-2">
                      Welcome to Wedding Theory CMS
                    </h2>
                    <p className="text-[#666666]">
                      Please set up your password to complete your account registration
                    </p>
                  </div>

                  {error && (
                    <div className="bg-[#FFF3F3] border-l-4 border-[#FF4444] p-4 rounded">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          ⚠️
                        </div>
                        <div className="ml-3">
                          <p className="text-[#CC0000] text-sm">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-[#333333] mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <RiLockLine className="h-5 w-5 text-[#999999]" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors duration-200"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-[#333333] mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <RiLockLine className="h-5 w-5 text-[#999999]" />
                          </div>
                          <input
                            id="confirm-password"
                            name="confirm-password"
                            type="password"
                            required
                            className="appearance-none block w-full pl-10 pr-3 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-[#0066FF] transition-colors duration-200"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-[#0066FF] hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066FF] transition-colors duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Setting up your account...
                        </div>
                      ) : (
                        'Complete Setup'
                      )}
                    </button>
                  </form>
                </>
              );
            }}
          </SearchParamsWrapper>
        </Suspense>
      </div>
    </div>
  );
} 