'use client';

import { useEffect, useState } from 'react';
import { RiCalendarLine, RiVideoLine, RiArticleLine, RiUserSmileLine, RiTimeLine } from 'react-icons/ri';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
// Removed the problematic import
import Notification from './components/Notification';
import { formatDistanceToNow, format } from 'date-fns';

type DashboardCounts = {
  weddings: number;
  films: number;
  journals: number;
  testimonials: number;
};

type RecentActivity = {
  id: string;
  type: 'wedding' | 'film' | 'journal' | 'testimonial';
  action: string;
  details: string;
  time: string;
  link: string;
  status: 'draft' | 'published';
};

export default function Dashboard() {
  const [counts, setCounts] = useState<DashboardCounts>({
    weddings: 0,
    films: 0,
    journals: 0,
    testimonials: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchCounts();
    fetchRecentActivity();
  }, []);

  const fetchCounts = async () => {
    try {
      // Fetch counts for each table
      const [weddings, films, journals, testimonials] = await Promise.all([
        supabase.from('weddings').select('id', { count: 'exact' }),
        supabase.from('films').select('id', { count: 'exact' }),
        supabase.from('blog_posts').select('id', { count: 'exact' }),
        supabase.from('testimonials').select('id', { count: 'exact' })
      ]);

      setCounts({
        weddings: weddings.count || 0,
        films: films.count || 0,
        journals: journals.count || 0,
        testimonials: testimonials.count || 0
      });
    } catch (error) {
      console.error('Error fetching counts:', error);
      setNotification({ type: 'error', message: 'Failed to load dashboard data' });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const [weddings, films, journals, testimonials] = await Promise.all([
        supabase
          .from('weddings')
          .select('id, couple_names, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('films')
          .select('id, title, couple_names, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('blog_posts')
          .select('id, title, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('testimonials')
          .select('id, couple_names, created_at, status')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const activities = [
        ...(weddings.data?.map(w => ({
          id: w.id,
          type: 'wedding' as const,
          action: 'Wedding gallery added',
          details: w.couple_names,
          time: w.created_at,
          link: `/weddings?id=${w.id}`,
          status: w.status as 'draft' | 'published'
        })) || []),
        ...(films.data?.map(f => ({
          id: f.id,
          type: 'film' as const,
          action: 'Film uploaded',
          details: `${f.title} - ${f.couple_names}`,
          time: f.created_at,
          link: `/films?id=${f.id}`,
          status: f.status as 'draft' | 'published'
        })) || []),
        ...(journals.data?.map(b => ({
          id: b.id,
          type: 'journal' as const,
          action: 'Journal post created',
          details: b.title,
          time: b.created_at,
          link: `/wedding_journal?id=${b.id}`,
          status: b.status as 'draft' | 'published'
        })) || []),
        ...(testimonials.data?.map(t => ({
          id: t.id,
          type: 'testimonial' as const,
          action: 'Testimonial received',
          details: t.couple_names,
          time: t.created_at,
          link: `/testimonials?id=${t.id}`,
          status: t.status as 'draft' | 'published'
        })) || [])
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);

      setRecentActivity(activities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'wedding': return <RiCalendarLine className="w-5 h-5 text-blue-500" />;
      case 'film': return <RiVideoLine className="w-5 h-5 text-purple-500" />;
      case 'journal': return <RiArticleLine className="w-5 h-5 text-green-500" />;
      case 'testimonial': return <RiUserSmileLine className="w-5 h-5 text-orange-500" />;
      default: return <RiTimeLine className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const timeAgo = formatDistanceToNow(date, { addSuffix: true });
    const fullDate = format(date, 'MMM d, yyyy h:mm a');
    
    return {
      timeAgo,
      fullDate
    };
  };

  return (
    <div className='p-10 h-full overflow-y-auto'>
      <div className='mb-8'>
        <h1 className='text-4xl font-normal mb-4'>
          Welcome to Wedding Theory CMS
        </h1>
        <p className='text-gray-600 max-w-3xl leading-relaxed'>
          Manage your wedding stories, films, and content all in one place.
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        <Link href="/weddings">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiCalendarLine className='w-6 h-6 text-blue-500' />
              <h3 className='text-lg font-medium'>Wedding Gallery</h3>
            </div>
            <p className='text-3xl font-semibold'>{counts.weddings}</p>
          </div>
        </Link>

        <Link href="/films">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiVideoLine className='w-6 h-6 text-purple-500' />
              <h3 className='text-lg font-medium'>Films</h3>
            </div>
            <p className='text-3xl font-semibold'>{counts.films}</p>
          </div>
        </Link>

        <Link href="/wedding_journal">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiArticleLine className='w-6 h-6 text-green-500' />
              <h3 className='text-lg font-medium'>Journal Posts</h3>
            </div>
            <p className='text-3xl font-semibold'>{counts.journals}</p>
          </div>
        </Link>

        <Link href="/testimonials">
          <div className='bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105'>
            <div className='flex items-center space-x-3 mb-4'>
              <RiUserSmileLine className='w-6 h-6 text-orange-500' />
              <h3 className='text-lg font-medium'>Testimonials</h3>
            </div>
            <p className='text-3xl font-semibold'>{counts.testimonials}</p>
          </div>
        </Link>
      </div>

      <div className='bg-white rounded-lg shadow-sm'>
        <div className='p-6'>
          <h2 className='text-2xl font-normal mb-6'>Recent Activity</h2>
          <div className='space-y-4 max-h-[calc(100vh-24rem)] overflow-y-auto'>
            {recentActivity.map((item) => (
              <Link href={item.link} key={`${item.type}-${item.id}`}>
                <div className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all'>
                  <div className='flex items-center space-x-4'>
                    {getActivityIcon(item.type)}
                    <div>
                      <div className='flex items-center space-x-2'>
                        <p className='font-medium'>{item.action}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          item.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className='text-sm text-gray-600'>{item.details}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className='text-sm font-medium text-gray-900'>
                      {formatActivityTime(item.time).timeAgo}
                    </span>
                    <span className='text-xs text-gray-500' title={formatActivityTime(item.time).fullDate}>
                      {format(new Date(item.time), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          show={true}
        />
      )}
    </div>
  );
}
