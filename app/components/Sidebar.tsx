'use client';

import { navigationItems } from '../config/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className='w-64 bg-white flex flex-col shadow-md'>
      <div className='p-6 text-2xl font-bold border-b border-gray-100'>
        Wedding Theory CMS
      </div>
      <nav className='flex-1'>
        <ul>
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link href={item.path}>
                <div 
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer
                    ${pathname === item.path ? 'bg-gray-50' : ''}`}
                >
                  {item.label}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className='p-4 border-t border-gray-100 cursor-pointer'>
        Sign Up
      </div>
    </div>
  );
} 