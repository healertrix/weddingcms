'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { RiLogoutBoxLine } from 'react-icons/ri';

type User = {
  email: string;
  role: string;
};

export default function UserInfo() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUserInfo();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        fetchUserInfo();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        return;
      }

      const { data: userData } = await supabase
        .from('cms_users')
        .select('email, role')
        .eq('id', session.user.id)
        .single();

      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className='mt-auto p-4 border-t border-gray-100'>
      <div className='flex items-center justify-between'>
        <div className='flex-1 min-w-0'>
          <p className='text-sm font-medium text-gray-900 truncate'>
            {user.email}
          </p>
          <p className='text-xs text-gray-500 capitalize'>
            {user.role}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className='ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors'
          title='Logout'
        >
          <RiLogoutBoxLine className='w-5 h-5' />
        </button>
      </div>
    </div>
  );
} 