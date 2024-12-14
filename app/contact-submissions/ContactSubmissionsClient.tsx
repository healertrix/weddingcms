'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RiSearchLine, RiCalendarLine, RiMailLine, RiPhoneLine, RiBookOpenLine, RiCloseLine, RiArrowRightLine, RiDeleteBin6Line, RiErrorWarningLine } from 'react-icons/ri';
import { format } from 'date-fns';
import ConfirmModal from '../components/ConfirmModal';

interface ContactSubmission {
  id: string;
  couple_name: string;
  email: string;
  phone: string | null;
  wedding_start_date: string;
  wedding_end_date: string;
  story: string | null;
  created_at: string;
}

interface Props {
  initialSubmissions: ContactSubmission[];
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export default function ContactSubmissionsClient({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<ContactSubmission | null>(null);
  const [deletingSubmission, setDeletingSubmission] = useState<ContactSubmission | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const supabase = createClientComponentClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('contact_submissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_submissions'
        },
        async (payload) => {
          // Refresh the entire list when there's a change
          const { data } = await supabase
            .from('contact_submissions')
            .select('*')
            .order('created_at', { ascending: false });
          if (data) {
            setSubmissions(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDeleteClick = (submission: ContactSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSubmission(submission);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingSubmission) return;
    setIsDeleting(true);
    setDeleteProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const { error } = await supabase
        .from('contact_submissions')
        .delete()
        .eq('id', deletingSubmission.id);

      if (error) throw error;

      setDeleteProgress(100);

      // Update local state after a brief delay to show completion
      setTimeout(() => {
        setSubmissions(prev => prev.filter(s => s.id !== deletingSubmission.id));
        setShowDeleteConfirm(false);
        setDeletingSubmission(null);
        setDeleteProgress(0);
      }, 500);

      clearInterval(progressInterval);
    } catch (error) {
      console.error('Error deleting submission:', error);
      alert('Failed to delete submission. Please try again.');
      setDeleteProgress(0);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter submissions based on search query and date filter
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.couple_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      submission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (submission.phone && submission.phone.includes(searchQuery)) ||
      (submission.story && submission.story.toLowerCase().includes(searchQuery.toLowerCase()));

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    if (dateFilter === 'upcoming') {
      const weddingStartDate = new Date(submission.wedding_start_date);
      return matchesSearch && weddingStartDate >= today;
    }

    if (dateFilter === 'custom' && startDate && endDate) {
      const submissionStartDate = new Date(submission.wedding_start_date);
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      filterEndDate.setHours(23, 59, 59, 999); // Include the entire end date

      return matchesSearch && 
        submissionStartDate >= filterStartDate && 
        submissionStartDate <= filterEndDate;
    }

    return matchesSearch;
  });

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="mt-4 relative">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by name, email, phone, or story..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
                aria-label="Search submissions"
              />
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
            <div className="min-w-[130px]">
              <select
                value={dateFilter}
                onChange={(e) => {
                  const value = e.target.value as 'all' | 'upcoming' | 'custom';
                  setDateFilter(value);
                  if (value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200 bg-white"
                aria-label="Filter by date"
              >
                <option value="all">All Dates</option>
                <option value="upcoming">Upcoming</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
                  placeholder="Start Date"
                />
              </div>
              <div className="flex-1">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
                  min={startDate}
                  placeholder="End Date"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 bg-white rounded-lg shadow-sm mt-6 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 p-6">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No submissions found</p>
              </div>
            ) : (
              filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className="group relative bg-white border rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#8B4513] transition-colors">
                        {submission.couple_name}
                      </h3>
                      <RiArrowRightLine className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(submission, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete submission"
                    >
                      <RiDeleteBin6Line className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left Column - Contact Info */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-600">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <RiMailLine className="w-4 h-4 text-blue-600" />
                          </div>
                          <a 
                            href={`mailto:${submission.email}`} 
                            className="text-sm hover:text-blue-600"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {submission.email}
                          </a>
                        </div>
                        {submission.phone && (
                          <div className="flex items-center gap-3 text-gray-600">
                            <div className="bg-blue-50 p-2 rounded-lg">
                              <RiPhoneLine className="w-4 h-4 text-blue-600" />
                            </div>
                            <a 
                              href={`tel:${submission.phone}`} 
                              className="text-sm hover:text-blue-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {submission.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Wedding Dates */}
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <RiCalendarLine className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Wedding Dates</div>
                          <div className="space-y-0.5 text-sm text-gray-600">
                            <p>Start: {format(new Date(submission.wedding_start_date), 'MMM d, yyyy')}</p>
                            <p>End: {format(new Date(submission.wedding_end_date), 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Story Preview */}
                    {submission.story && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <RiBookOpenLine className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">Their Story</span>
                          </div>
                          <span className="text-xs text-blue-600">Click to read more</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {submission.story}
                        </p>
                      </div>
                    )}

                    {/* Submission Time */}
                    <div className="mt-4 text-xs text-gray-400 text-right">
                      Submitted {format(new Date(submission.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed View Modal */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedSubmission.couple_name}
              </h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <RiCloseLine className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-88px)]">
              {/* Contact Info Section */}
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Email</div>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <RiMailLine className="w-4 h-4 text-blue-600" />
                        </div>
                        <a href={`mailto:${selectedSubmission.email}`} className="text-sm hover:text-blue-600">
                          {selectedSubmission.email}
                        </a>
                      </div>
                    </div>
                    {selectedSubmission.phone && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Phone</div>
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <RiPhoneLine className="w-4 h-4 text-blue-600" />
                          </div>
                          <a href={`tel:${selectedSubmission.phone}`} className="text-sm hover:text-blue-600">
                            {selectedSubmission.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Wedding Dates</div>
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <RiCalendarLine className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-900">
                          Start: {format(new Date(selectedSubmission.wedding_start_date), 'MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-900">
                          End: {format(new Date(selectedSubmission.wedding_end_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400">
                  Submitted on {format(new Date(selectedSubmission.created_at), 'MMMM d, yyyy h:mm a')}
                </div>

                {/* Story Section */}
                {selectedSubmission.story && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <RiBookOpenLine className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-medium text-gray-900">Their Story</h4>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedSubmission.story}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingSubmission && (
        <ConfirmModal
          title="Delete Submission"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this submission?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>Contact information</li>
                    <li>Wedding dates</li>
                    <li>Their story</li>
                  </ul>
                  <div className="text-red-800 font-medium mt-2">This action cannot be undone.</div>
                </div>
              </div>
              {isDeleting && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-600 transition-all duration-300 ease-out"
                      style={{ width: `${deleteProgress}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-2 text-center">
                    Deleting submission... {deleteProgress}%
                  </div>
                </div>
              )}
            </div>
          }
          confirmLabel={isDeleting ? "Deleting..." : "Delete Permanently"}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            if (!isDeleting) {
              setShowDeleteConfirm(false);
              setDeletingSubmission(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDeleting}
        />
      )}
    </>
  );
} 