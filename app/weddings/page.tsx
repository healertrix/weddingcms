'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiImageLine, RiZoomInLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import WeddingForm, { WeddingFormData } from './WeddingForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';

interface Wedding {
  id: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  featured_image_key: string | null;
  is_featured_home: boolean;
  gallery_images: string[];
  status: 'draft' | 'published';
}

export default function WeddingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [editingWedding, setEditingWedding] = useState<Wedding | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWedding, setDeletingWedding] = useState<Wedding | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeddings(data as Wedding[]);
    } catch (error) {
      console.error('Error fetching weddings:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published') => {
    try {
      const { error } = await supabase
        .from('weddings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setWeddings(prevWeddings =>
        prevWeddings.map(wedding =>
          wedding.id === id ? { ...wedding, status: newStatus } : wedding
        )
      );
    } catch (error) {
      console.error('Error updating wedding status:', error);
    }
  };

  const handleDeleteClick = (wedding: Wedding) => {
    setDeletingWedding(wedding);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWedding) return;
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

      // Delete featured image if exists
      if (deletingWedding.featured_image_key) {
        setDeleteProgress(20);
        const imageResponse = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: deletingWedding.featured_image_key }),
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to delete featured image from storage');
        }
        setDeleteProgress(40);
      }

      // Delete gallery images if they exist
      if (deletingWedding.gallery_images && deletingWedding.gallery_images.length > 0) {
        setDeleteProgress(50);
        for (const imageUrl of deletingWedding.gallery_images) {
          const galleryResponse = await fetch('/api/upload/delete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageKey: imageUrl }),
          });

          if (!galleryResponse.ok) {
            throw new Error('Failed to delete gallery image from storage');
          }
        }
        setDeleteProgress(70);
      }

      // Delete the wedding from database
      const { error: deleteError } = await supabase
        .from('weddings')
        .delete()
        .eq('id', deletingWedding.id);

      if (deleteError) throw deleteError;

      setDeleteProgress(100);

      setTimeout(() => {
        setWeddings(prevWeddings => prevWeddings.filter(w => w.id !== deletingWedding.id));
        setShowDeleteConfirm(false);
        setDeletingWedding(null);
        setDeleteProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error deleting wedding:', error);
      setDeleteProgress(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: WeddingFormData, saveAsDraft: boolean = false) => {
    try {
      // Only validate couple_names as required
      if (!data.coupleNames?.trim()) {
        throw new Error('Couple names is required');
      }

      // Format the data with nullable fields
      const weddingData = {
        couple_names: data.coupleNames.trim(),
        wedding_date: data.weddingDate?.trim() || null,
        location: data.location?.trim() || null,
        featured_image_key: data.featuredImageKey?.trim() || null,
        gallery_images: data.gallery_images || [],
        is_featured_home: Boolean(data.isFeaturedHome),
        status: saveAsDraft ? 'draft' : 'published'
      };

      console.log('Submitting wedding data:', weddingData);

      if (editingWedding) {
        const { data: updateData, error } = await supabase
          .from('weddings')
          .update(weddingData)
          .eq('id', editingWedding.id)
          .select();

        if (error) {
          console.error('Error updating wedding:', error);
          throw new Error(error.message);
        }
        console.log('Wedding updated successfully:', updateData);
      } else {
        const { data: insertData, error } = await supabase
          .from('weddings')
          .insert([weddingData])
          .select();

        if (error) {
          console.error('Error creating wedding:', error);
          throw new Error(error.message);
        }
        console.log('Wedding created successfully:', insertData);
      }

      await fetchWeddings();
      setShowForm(false);
      setEditingWedding(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      throw error instanceof Error ? error : new Error('An unknown error occurred');
    }
  };

  const filteredWeddings = weddings.filter(wedding => {
    const matchesSearch = 
      wedding.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
      wedding.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || wedding.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Wedding Gallery"
          description="Manage your wedding galleries and stories"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Wedding
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search weddings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200"
              />
              <RiSearchLine 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')}
              className="px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] border-gray-200 bg-white min-w-[130px]"
              aria-label="Filter weddings by status"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow-sm mt-6 overflow-hidden flex flex-col min-h-0'>
        <div className='flex-1 overflow-y-auto'>
          <div className='grid grid-cols-1 gap-6 p-6'>
            {filteredWeddings.map((wedding) => (
              <div 
                key={wedding.id} 
                className='flex flex-col md:flex-row gap-6 p-6 bg-white border rounded-xl hover:shadow-md transition-all duration-200'
              >
                {wedding.featured_image_key && (
                  <div className="flex-shrink-0 w-full md:w-64 h-64 md:h-48 relative rounded-lg overflow-hidden group">
                    <img
                      src={wedding.featured_image_key}
                      alt={`${wedding.couple_names}'s wedding`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewImage(wedding.featured_image_key)}
                    >
                      <RiZoomInLine className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transform scale-0 group-hover:scale-100 transition-all duration-300" />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className='text-xl font-medium text-gray-900'>{wedding.couple_names}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          wedding.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {wedding.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className='flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4'>
                        <span className="flex items-center">
                          <RiCalendarLine className="mr-1.5" />
                          {formatDate(wedding.wedding_date)}
                        </span>
                        <span className="flex items-center">
                          <RiMapPinLine className="mr-1.5" />
                          {wedding.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t mt-auto">
                    {wedding.status === 'draft' ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(wedding.id, 'published')}
                        className="bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(wedding.id, 'draft')}
                        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingWedding(wedding);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeleteClick(wedding)}
                      className="text-red-600 hover:bg-red-50"
                      title="Delete wedding"
                    >
                      <RiDeleteBin6Line />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredWeddings.length === 0 && (
              <div className="text-center py-12">
                <RiImageLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No weddings found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new wedding</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewImage && (
        <div 
          className="fixed inset-0 z-50 bg-black"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
          >
            <RiCloseLine className="w-8 h-8" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Full size preview"
              className="w-full h-full object-contain"
              style={{
                maxWidth: '100vw',
                maxHeight: '100vh',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}

      {showForm && (
        <WeddingForm 
          onClose={() => {
            setShowForm(false);
            setEditingWedding(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingWedding ? {
            coupleNames: editingWedding.couple_names,
            weddingDate: editingWedding.wedding_date,
            location: editingWedding.location,
            featuredImageKey: editingWedding.featured_image_key || '',
            gallery_images: editingWedding.gallery_images || [],
            isFeaturedHome: editingWedding.is_featured_home || false
          } : undefined}
        />
      )}

      {showDeleteConfirm && deletingWedding && (
        <ConfirmModal
          title="Delete Wedding"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this wedding?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>The wedding details</li>
                    {deletingWedding.featured_image_key && <li>Featured image</li>}
                    {deletingWedding.gallery_images && deletingWedding.gallery_images.length > 0 && (
                      <li>All gallery images ({deletingWedding.gallery_images.length} images)</li>
                    )}
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
                    {deleteProgress < 40 && "Deleting featured image..."}
                    {deleteProgress >= 40 && deleteProgress < 70 && "Deleting gallery images..."}
                    {deleteProgress >= 70 && deleteProgress < 100 && "Deleting wedding details..."}
                    {deleteProgress === 100 && "Deletion complete"}
                    {" "}{deleteProgress}%
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
              setDeletingWedding(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDeleting}
        />
      )}
    </div>
  );
} 