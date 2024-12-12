'use client';

import { useEffect, useState } from 'react';
import { navigationItems } from '../config/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import UserInfo from './UserInfo';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Sidebar() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        checkUserRole();
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session) {
      checkUserRole();
    }
  };

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data: userData } = await supabase
      .from('cms_users')
      .select('role')
      .eq('email', user.email)
      .single();
    
    console.log('User role data:', userData);
    const isAdminUser = userData?.role?.toLowerCase() === 'admin';
    console.log('Is admin?', isAdminUser);
    setIsAdmin(isAdminUser);
  };

  if (!isAuthenticated) return null;

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin)
  );
  
  console.log('Is admin state:', isAdmin);
  console.log('Filtered navigation items:', filteredNavItems);

  return (
    <div className='w-64 bg-white flex flex-col shadow-md h-screen'>
      <div className='p-6 text-2xl font-bold border-b border-gray-100'>
        Wedding Theory
      </div>
      <nav className='flex-1 pt-4'>
        <ul className='space-y-1'>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <div 
                    className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer
                      ${pathname === item.path ? 'bg-gray-50 border-l-4 border-[#8B4513]' : ''}`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <UserInfo />
    </div>
  );
} 