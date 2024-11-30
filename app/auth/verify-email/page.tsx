'use client';

import Link from 'next/link';
import { RiMailLine } from 'react-icons/ri';

export default function VerifyEmail() {
  return (
    <div className='min-h-screen flex items-center justify-center p-10'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-8'>
          <div className='flex justify-center mb-6'>
            <div className='bg-blue-100 p-4 rounded-full'>
              <RiMailLine className='w-12 h-12 text-blue-500' />
            </div>
          </div>
          <h1 className='text-4xl font-normal mb-4'>
            Check Your Email
          </h1>
          <p className='text-gray-600 leading-relaxed'>
            We've sent you an email with a link to verify your account. Please check your inbox and follow the instructions.
          </p>
        </div>

        <div className='bg-white rounded-lg shadow-sm p-8'>
          <p className='text-gray-600 mb-6'>
            Didn't receive the email? Check your spam folder or try signing in again.
          </p>
          
          <Link 
            href="/auth/login"
            className='inline-block w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors'
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
} 