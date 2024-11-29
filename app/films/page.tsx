'use client';

import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiVideoLine } from 'react-icons/ri';
import FilmForm, { FilmFormData } from './FilmForm';
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
  const [deletingFilm, setDeletingFilm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
        .eq('id', deletingFilm);

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

  const filteredFilms = films.filter(film => 
    film.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    film.couple_names.toLowerCase().includes(searchQuery.toLowerCase()) ||
    film.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    film.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Wedding Films"
          description="Manage your wedding films and videos"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Film
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search films..."
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
            {filteredFilms.map((film) => (
              <div key={film.id} className='flex flex-col p-6 border rounded-lg hover:bg-gray-50 transition-all duration-200 group'>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className='text-xl font-medium text-gray-900 truncate'>{film.title}</h3>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${
                        film.status === 'published' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {film.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    
                    <div className='flex items-center text-sm text-gray-500 space-x-4 mb-3 flex-wrap'>
                      <span className="flex items-center flex-shrink-0">
                        <RiCalendarLine className="mr-1" />
                        {new Date(film.wedding_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center flex-shrink-0">
                        <RiMapPinLine className="mr-1" />
                        <span className="truncate max-w-[200px]">{film.location}</span>
                      </span>
                      <span className="flex items-center flex-shrink-0">
                        <RiVideoLine className="mr-1" />
                        <span className="truncate max-w-[200px]">{film.couple_names}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {getStatusActions(film)}
                    <Button 
                      variant='secondary' 
                      icon={RiEditLine}
                      onClick={() => {
                        setEditingFilm(film);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant='secondary' 
                      icon={RiDeleteBin6Line}
                      onClick={() => handleDeleteClick(film.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex gap-6 mt-4">
                  {film.image_key && (
                    <div className="flex-shrink-0">
                      <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/film-images/${film.image_key}`}
                        alt={film.title}
                        className="w-48 h-32 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <p className="line-clamp-3 break-words">
                        {formatDescription(film.description)}
                      </p>
                    </div>
                  </div>
                </div>

                {film.is_featured_home && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex-shrink-0">
                      Featured on Home
                    </span>
                  </div>
                )}
              </div>
            ))}
            {filteredFilms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <RiVideoLine className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg">No films found matching your search.</p>
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

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingFilm(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Film"
        message="Are you sure you want to delete this film? This action cannot be undone."
      />
    </div>
  );
} 