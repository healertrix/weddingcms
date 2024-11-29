'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine } from 'react-icons/ri';
import WeddingForm, { WeddingFormData } from './WeddingForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import Notification from '../components/Notification';

interface Wedding {
  id: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  featured_image_key: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  is_featured_home: boolean;
}

export default function WeddingsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWedding, setDeletingWedding] = useState<string | null>(null);
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [editingWedding, setEditingWedding] = useState<Wedding | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    fetchWeddings();
  }, []);

  const fetchWeddings = async () => {
    try {
      const { data, error } = await supabase
        .from('weddings')
        .select(`
          *,
          wedding_gallery_images (
            id,
            image_key,
            order_index
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWeddings(data || []);
    } catch (error) {
      console.error('Error fetching weddings:', error);
      setNotification({ type: 'error', message: 'Failed to load weddings' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const { error } = await supabase
        .from('weddings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setWeddings(weddings.map(wedding =>
        wedding.id === id ? { ...wedding, status: newStatus } : wedding
      ));
      setNotification({ type: 'success', message: `Wedding ${newStatus} successfully` });
    } catch (error) {
      console.error('Error updating wedding status:', error);
      setNotification({ type: 'error', message: 'Failed to update wedding status' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingWedding) {
      try {
        const { error } = await supabase
          .from('weddings')
          .delete()
          .eq('id', deletingWedding);

        if (error) throw error;

        setWeddings(weddings.filter(w => w.id !== deletingWedding));
        setNotification({ type: 'success', message: 'Wedding deleted successfully' });
      } catch (error) {
        console.error('Error deleting wedding:', error);
        setNotification({ type: 'error', message: 'Failed to delete wedding' });
      } finally {
        setShowDeleteConfirm(false);
        setDeletingWedding(null);
      }
    }
  };

  const handleSubmit = async (data: WeddingFormData) => {
    try {
      const now = new Date().toISOString();
      
      if (editingWedding) {
        // Update existing wedding
        const { error } = await supabase
          .from('weddings')
          .update({
            couple_names: data.coupleNames,
            wedding_date: data.weddingDate,
            location: data.location,
            featured_image_key: data.featuredImageKey,
            updated_at: now
          })
          .eq('id', editingWedding.id);

        if (error) throw error;

        setWeddings(weddings.map(w =>
          w.id === editingWedding.id
            ? {
                ...w,
                couple_names: data.coupleNames,
                wedding_date: data.weddingDate,
                location: data.location,
                featured_image_key: data.featuredImageKey,
                updated_at: now
              }
            : w
        ));
        setNotification({ type: 'success', message: 'Wedding updated successfully' });
      } else {
        // Create new wedding
        const { data: newWedding, error } = await supabase
          .from('weddings')
          .insert([{
            couple_names: data.coupleNames,
            wedding_date: data.weddingDate,
            location: data.location,
            featured_image_key: data.featuredImageKey,
            status: 'draft',
            created_at: now,
            updated_at: now
          }])
          .select()
          .single();

        if (error) throw error;

        setWeddings([newWedding, ...weddings]);
        setNotification({ type: 'success', message: 'Wedding created successfully' });
      }

      setShowForm(false);
      setEditingWedding(null);
    } catch (error) {
      console.error('Error saving wedding:', error);
      setNotification({ type: 'error', message: 'Failed to save wedding' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingWedding(id);
    setShowDeleteConfirm(true);
  };

  const getStatusActions = (wedding: Wedding) => {
    return wedding.status === 'draft' ? (
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
    );
  };

  const filteredWeddings = weddings.filter(wedding => 
    wedding.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wedding.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Wedding Gallery"
          description="Manage your wedding galleries"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Gallery
            </Button>
          }
        />
        
        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <div className="mt-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search weddings..."
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
            {filteredWeddings.map((wedding) => (
              <div key={wedding.id} className='flex flex-col p-6 border rounded-lg hover:bg-gray-50 transition-all duration-200 group'>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className='text-xl font-medium text-gray-900 truncate'>{wedding.couple_names}</h3>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                        wedding.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {wedding.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className='flex items-center text-sm text-gray-500 space-x-4 mb-3 flex-wrap'>
                      <span className="flex items-center flex-shrink-0">
                        <RiCalendarLine className="mr-1" />
                        {formatDate(wedding.wedding_date)}
                      </span>
                      <span className="flex items-center flex-shrink-0">
                        <RiMapPinLine className="mr-1" />
                        <span className="truncate max-w-[200px]">{wedding.location}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {getStatusActions(wedding)}
                    <Button 
                      variant='secondary' 
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingWedding(wedding);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant='secondary' 
                      icon={RiDeleteBin6Line}
                      onClick={() => handleDeleteClick(wedding.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  {wedding.featured_image_key && (
                    <div className="flex-shrink-0">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wedding-images/${wedding.featured_image_key}`}
                        alt={`${wedding.couple_names} wedding`}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {wedding.is_featured_home && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
                      Featured on Home
                    </span>
                  </div>
                )}
              </div>
            ))}
            {filteredWeddings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <RiCalendarLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No weddings found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <WeddingForm 
          onClose={() => {
            setShowForm(false);
            setEditingWedding(null);
          }}
          onSubmit={handleSubmit}
          initialData={editingWedding ? {
            coupleNames: editingWedding.couple_names,
            weddingDate: editingWedding.wedding_date,
            location: editingWedding.location,
            featuredImageKey: editingWedding.featured_image_key,
          } : undefined}
        />
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingWedding(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Wedding Gallery"
        message="Are you sure you want to delete this wedding gallery? This action cannot be undone."
      />
    </div>
  );
} 