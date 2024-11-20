'use client';

import { navigationItems } from '../config/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className='w-64 bg-white flex flex-col shadow-md'>
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
      <div className='p-4 border-t border-gray-100'>
        <div className='flex items-center space-x-3'>
          <div className='w-8 h-8 rounded-full bg-gray-200'></div>
          <div>
            <p className='text-sm font-medium'>Admin User</p>
            <p className='text-xs text-gray-500'>admin@weddingtheory.com</p>
          </div>
        </div>
      </div>
    </div>
  );
} 