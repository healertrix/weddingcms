'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiVideoLine, RiZoomInLine, RiCloseLine, RiErrorWarningLine } from 'react-icons/ri';
import FilmForm, { FilmFormData } from './FilmForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';

type FilmStatus = 'draft' | 'published';

type Film = {
  id: string;
  title: string;
  couple_names: string;
  wedding_date: string;
  location: string;
  description: string;
  video_url: string;
  status: FilmStatus;
  image_key: string | null;
  created_at: string;
  updated_at: string;
  is_featured_home: boolean;
};

const formatDescription = (description: string) => {
  const strippedContent = description.replace(/<[^>]+>/g, ' ').trim();
  return strippedContent.length > 150 ? `${strippedContent.substring(0, 150)}...` : strippedContent;
};

export default function FilmsPage() {
  const [showForm, setShowForm] = useState(false);
  const [films, setFilms] = useState<Film[]>([]);
  const [editingFilm, setEditingFilm] = useState<Film | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingFilm, setDeletingFilm] = useState<Film | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  useEffect(() => {
    fetchFilms();
  }, []);

  const fetchFilms = async () => {
    try {
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching films:', error.message);
        return;
      }

      if (data) {
        setFilms(data as Film[]);
      }
    } catch (error) {
      console.error('Error in fetchFilms:', error);
    }
  };

  const handleStatusChange = async (filmId: string, newStatus: FilmStatus) => {
    try {
      const { error } = await supabase
        .from('films')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', filmId);

      if (error) throw error;

      setFilms(prevFilms =>
        prevFilms.map(f =>
          f.id === filmId ? { ...f, status: newStatus } : f
        )
      );
    } catch (error) {
      console.error('Error updating film status:', error);
    }
  };

  const handleFeaturedChange = async (filmId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('films')
        .update({ is_featured_home: featured })
        .eq('id', filmId);

      if (error) throw error;

      setFilms(prevFilms =>
        prevFilms.map(f =>
          f.id === filmId ? { ...f, is_featured_home: featured } : f
        )
      );
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const handleSubmit = async (data: FilmFormData, saveAsDraft: boolean = false) => {
    try {
      const now = new Date().toISOString();
      const filmData = {
        title: data.title,
        couple_names: data.coupleNames,
        wedding_date: data.weddingDate,
        location: data.location,
        description: data.description,
        video_url: data.videoUrl,
        status: saveAsDraft ? 'draft' : 'published',
        updated_at: now
      };

      if (editingFilm) {
        const { error } = await supabase
          .from('films')
          .update(filmData)
          .eq('id', editingFilm.id);

        if (error) {
          console.error('Error updating film:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('films')
          .insert({
            ...filmData,
            created_at: now
          });

        if (error) {
          console.error('Error creating film:', error);
          return;
        }
      }

      await fetchFilms();
      setShowForm(false);
      setEditingFilm(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingFilm(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletingFilm) {
      const { error } = await supabase
        .from('films')
        .delete()
        .eq('id', deletingFilm.id);

      if (error) {
        console.error('Error deleting film:', error);
        return;
      }

      await fetchFilms();
      setShowDeleteConfirm(false);
      setDeletingFilm(null);
      router.refresh();
    }
  };

  const getStatusActions = (film: Film) => {
    return film.status === 'draft' ? (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(film.id, 'published')}
        className="bg-green-50 text-green-600 hover:bg-green-100"
      >
        Publish
      </Button>
    ) : (
      <Button
        variant="secondary"
        onClick={() => handleStatusChange(film.id, 'draft')}
        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
      >
        Unpublish
      </Button>
    );
  };

  const filteredFilms = films.filter(film => {
    const matchesSearch = 
      film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
      film.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || film.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Films"
          description="Manage your wedding films and videos"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Film
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search films..."
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
              aria-label="Filter films by status"
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
            {filteredFilms.map((film) => (
              <div 
                key={film.id} 
                className='flex flex-col md:flex-row gap-6 p-6 bg-white border rounded-xl hover:shadow-md transition-all duration-200'
              >
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className='text-xl font-medium text-gray-900'>{film.title}</h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          film.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {film.status === 'published' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                      
                      <div className='flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4'>
                        <span className="flex items-center">
                          <RiCalendarLine className="mr-1.5" />
                          {formatDate(film.wedding_date)}
                        </span>
                        <span className="flex items-center">
                          <RiMapPinLine className="mr-1.5" />
                          {film.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 flex-grow mb-4 line-clamp-3">{film.description}</p>

                  <div className="flex items-center gap-3 pt-4 border-t">
                    {film.status === 'draft' ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(film.id, 'published')}
                        className="bg-green-50 text-green-600 hover:bg-green-100"
                      >
                        Publish
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => handleStatusChange(film.id, 'draft')}
                        className="bg-gray-50 text-gray-600 hover:bg-gray-100"
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      variant="secondary"
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingFilm(film);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleDeleteClick(film)}
                      className="text-red-600 hover:bg-red-50"
                      title="Delete film"
                    >
                      <RiDeleteBin6Line />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFilms.length === 0 && (
              <div className="text-center py-12">
                <RiVideoLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg text-gray-500">No films found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new film</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <FilmForm 
          onClose={() => {
            setShowForm(false);
            setEditingFilm(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingFilm ? {
            title: editingFilm.title,
            coupleNames: editingFilm.couple_names,
            weddingDate: editingFilm.wedding_date,
            location: editingFilm.location,
            description: editingFilm.description,
            videoUrl: editingFilm.video_url,
          } : undefined}
        />
      )}

      {showDeleteConfirm && deletingFilm && (
        <ConfirmModal
          title="Delete Film"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this film?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>The film details</li>
                    <li>Thumbnail image</li>
                    <li>Video link</li>
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
                    Deleting film... {deleteProgress}%
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
              setDeletingFilm(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDeleting}
        />
      )}
    </div>
  );
} 