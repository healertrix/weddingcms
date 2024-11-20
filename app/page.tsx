'use client';

import { RiCalendarLine, RiVideoLine, RiArticleLine, RiUserSmileLine } from 'react-icons/ri';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className='p-10 h-full overflow-y-auto'>
      <div className='mb-8'>
        <h1 className='text-4xl font-normal mb-4'>
          Welcome to Wedding Theory CMS
        </h1>
        <p className='text-gray-600 max-w-3xl leading-relaxed'>
          Manage your wedding stories, films, and content all in one place. Keep track of your latest projects and client testimonials.
        </p>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Link href="/weddings">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiCalendarLine className='w-6 h-6 text-[#8B4513]' />
              <h3 className='text-lg font-medium'>Wedding Gallery</h3>
            </div>
            <p className='text-3xl font-semibold'>12</p>
          </div>
        </Link>

        <Link href="/films">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiVideoLine className='w-6 h-6 text-[#8B4513]' />
              <h3 className='text-lg font-medium'>Recent Films</h3>
            </div>
            <p className='text-3xl font-semibold'>8</p>
          </div>
        </Link>

        <Link href="/blog">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiArticleLine className='w-6 h-6 text-[#8B4513]' />
              <h3 className='text-lg font-medium'>Blog Posts</h3>
            </div>
            <p className='text-3xl font-semibold'>24</p>
          </div>
        </Link>

        <Link href="/testimonials">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiUserSmileLine className='w-6 h-6 text-[#8B4513]' />
              <h3 className='text-lg font-medium'>Testimonials</h3>
            </div>
            <p className='text-3xl font-semibold'>45</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className='bg-white rounded-lg shadow-sm'>
        <div className='p-6'>
          <h2 className='text-2xl font-normal mb-6'>Recent Activity</h2>
          <div className='space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto'>
            {[
              { action: 'New wedding story added', details: 'Priya & Rahul - Delhi Wedding', time: '2 hours ago' },
              { action: 'Film uploaded', details: 'Sarah & Mike\'s Wedding Highlights', time: '5 hours ago' },
              { action: 'Blog post published', details: 'Top Wedding Trends 2024', time: '1 day ago' },
              { action: 'New testimonial received', details: 'From Anjali & Vikram', time: '2 days ago' },
            ].map((item, index) => (
              <div key={index} className='flex items-center justify-between p-3 border-b last:border-0'>
                <div>
                  <p className='font-medium'>{item.action}</p>
                  <p className='text-sm text-gray-600'>{item.details}</p>
                </div>
                <span className='text-sm text-gray-500'>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
