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
  const supabase = createClientComponentClient();

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  if (!isAuthenticated) return null;

  return (
    <div className='w-64 bg-white flex flex-col shadow-md h-screen'>
      <div className='p-6 text-2xl font-bold border-b border-gray-100'>
        Wedding Theory
      </div>
      <nav className='flex-1 pt-4'>
        <ul className='space-y-1'>
          {navigationItems.map((item) => {
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