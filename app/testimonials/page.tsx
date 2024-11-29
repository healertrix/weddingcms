'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiUserSmileLine, RiVideoLine } from 'react-icons/ri';
import TestimonialForm, { TestimonialFormData } from './TestimonialForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';

type TestimonialStatus = 'draft' | 'published';

type Testimonial = {
  id: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  review: string;
  video_url: string | null;
  image_key: string | null;
  status: TestimonialStatus;
};

const formatReview = (review: string) => {
  const strippedContent = review.replace(/<[^>]+>/g, ' ').trim();
  return strippedContent.length > 150 ? `${strippedContent.substring(0, 150)}...` : strippedContent;
};

export default function TestimonialsPage() {
  const [showForm, setShowForm] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTestimonial, setDeletingTestimonial] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching testimonials:', error.message);
        return;
      }

      if (data) {
        setTestimonials(data as Testimonial[]);
      }
    } catch (error) {
      console.error('Error in fetchTestimonials:', error);
    }
  };

  const handleStatusChange = async (testimonialId: string, newStatus: TestimonialStatus) => {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .update({
          status: newStatus
        })
        .eq('id', testimonialId)
        .select()
        .single();

      if (error) {
        console.error('Error updating testimonial status:', error.message);
        // You might want to add a notification here to show the error to the user
        return;
      }

      // Optimistically update the UI
      setTestimonials(prevTestimonials =>
        prevTestimonials.map(t =>
          t.id === testimonialId ? { ...t, status: newStatus } : t
        )
      );

      router.refresh();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
    }
  };

  const handleSubmit = async (data: TestimonialFormData, saveAsDraft: boolean = false) => {
    try {
      const testimonialData = {
        couple_names: data.coupleNames,
        wedding_date: data.weddingDate,
        location: data.location,
        review: data.review,
        video_url: data.videoUrl || null,
        status: saveAsDraft ? 'draft' : 'published'
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', editingTestimonial.id);

        if (error) {
          console.error('Error updating testimonial:', error.message);
          return;
        }
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);

        if (error) {
          console.error('Error creating testimonial:', error.message);
          return;
        }
      }

      await fetchTestimonials();
      setShowForm(false);
      setEditingTestimonial(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingTestimonial(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingTestimonial) {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', deletingTestimonial);

      if (error) {
        console.error('Error deleting testimonial:', error);
        return;
      }

      fetchTestimonials();
      setShowDeleteConfirm(false);
      setDeletingTestimonial(null);
      router.refresh();
    }
  };

  const getStatusActions = (testimonial: Testimonial) => {
    return testimonial.status === 'draft' ? (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(testimonial.id, 'published')}
        className="bg-green-50 text-green-600 hover:bg-green-100"
      >
        Publish
      </Button>
    ) : (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(testimonial.id, 'draft')}
        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
      >
        Unpublish
      </Button>
    );
  };

  const filteredTestimonials = testimonials.filter(testimonial => 
    testimonial.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.review.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Testimonials"
          description="Manage client reviews and testimonials"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Testimonial
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search testimonials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <RiSearchLine 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow mt-4 overflow-hidden flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 gap-4 p-6'>
            {filteredTestimonials.map((testimonial) => (
              <div key={testimonial.id} className='flex flex-col p-6 border rounded-lg hover:bg-gray-50 transition-all duration-200 group'>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className='text-xl font-medium text-gray-900 truncate'>{testimonial.couple_names}</h3>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                        testimonial.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {testimonial.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className='flex items-center text-sm text-gray-500 space-x-4 mb-3 flex-wrap'>
                      <span className="flex items-center flex-shrink-0">
                        <RiCalendarLine className="mr-1" />
                        {formatDate(testimonial.wedding_date)}
                      </span>
                      <span className="flex items-center flex-shrink-0">
                        <RiMapPinLine className="mr-1" />
                        <span className="truncate max-w-[200px]">{testimonial.location}</span>
                      </span>
                      {testimonial.video_url && (
                        <span className="flex items-center flex-shrink-0">
                          <RiVideoLine className="mr-1" />
                          <span className="truncate max-w-[200px]">Video Available</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {getStatusActions(testimonial)}
                    <Button 
                      variant='secondary' 
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingTestimonial(testimonial);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant='secondary' 
                      icon={RiDeleteBin6Line}
                      onClick={() => handleDeleteClick(testimonial.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  {testimonial.image_key && (
                    <div className="flex-shrink-0">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/testimonial-images/${testimonial.image_key}`}
                        alt={`${testimonial.couple_names} testimonial`}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <p className="line-clamp-3 break-words">
                        {formatReview(testimonial.review)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredTestimonials.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <RiUserSmileLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No testimonials found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <TestimonialForm 
          onClose={() => {
            setShowForm(false);
            setEditingTestimonial(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingTestimonial ? {
            coupleNames: editingTestimonial.couple_names,
            weddingDate: editingTestimonial.wedding_date,
            location: editingTestimonial.location,
            review: editingTestimonial.review,
            videoUrl: editingTestimonial.video_url || '',
          } : undefined}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingTestimonial(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Testimonial"
        message="Are you sure you want to delete this testimonial? This action cannot be undone."
      />
    </div>
  );
} 