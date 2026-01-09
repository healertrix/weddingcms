import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ContactSubmissionsClient from './ContactSubmissionsClient';
import PageHeader from '@/app/components/PageHeader';

export const dynamic = 'force-dynamic';

export default async function ContactSubmissionsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('cms_users')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!userData || userData.role !== 'admin') {
    redirect('/');
  }

  // Fetch initial submissions data
  const { data: submissions } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen max-h-screen flex flex-col p-8 overflow-hidden">
      <div className="flex-none">
        <PageHeader
          title="Contact Submissions"
          description="View and manage wedding contact form submissions"
        />
      </div>
      <ContactSubmissionsClient initialSubmissions={submissions || []} />
    </div>
  );
} 