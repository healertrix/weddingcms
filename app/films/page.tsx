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
  missingFields?: string[];
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
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
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

  const isFilmComplete = (film: Film) => {
    const missingFields = [];
    
    if (!film.title?.trim()) missingFields.push('Title');
    if (!film.couple_names?.trim()) missingFields.push('Couple Names');
    if (!film.wedding_date?.trim()) missingFields.push('Wedding Date');
    if (!film.location?.trim()) missingFields.push('Location');
    if (!film.description?.trim()) missingFields.push('Description');
    if (!film.video_url?.trim()) missingFields.push('Video URL');

    film.missingFields = missingFields;
    return missingFields.length === 0;
  };

  const handleStatusChange = async (filmId: string, newStatus: FilmStatus) => {
    const film = films.find(f => f.id === filmId);
    if (!film) return;

    if (newStatus === 'published' && !isFilmComplete(film)) {
      setSelectedFilm(film);
      setShowMissingFieldsModal(true);
      return;
    }

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

  const handleSubmit = async (data: FilmFormData, saveAsDraft: boolean = false) => {
    try {
      const now = new Date().toISOString();
      const filmData = {
        title: data.title,
        couple_names: data.couple_names,
        wedding_date: data.wedding_date,
        location: data.location,
        description: data.description,
        video_url: data.video_url,
        status: saveAsDraft ? 'draft' : 'published',
        updated_at: now
      };

      console.log('Submitting film data:', filmData);

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
      (film.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (film.couple_names?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (film.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
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
                {film.video_url && (
                  <div className="flex-shrink-0 w-full md:w-[320px] h-[180px] relative rounded-lg overflow-hidden group">
                    <div className="w-full h-full">
                      <VideoPreview url={film.video_url} />
                    </div>
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                      onClick={() => setPreviewVideo(film.video_url)}
                    >
                      <RiZoomInLine className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transform scale-0 group-hover:scale-100 transition-all duration-300" />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className='text-xl font-medium text-gray-900'>{film.couple_names}</h3>
                        <span className="text-sm text-gray-500">- {film.title}</span>
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
                        {film.video_url && (
                          <button
                            onClick={() => setPreviewVideo(film.video_url)}
                            className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <RiVideoLine className="mr-1.5" />
                            Watch Video
                          </button>
                        )}
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-3">{film.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t mt-auto">
                    {film.status === 'draft' ? (
                      <Button
                        variant="secondary"
                        onClick={() => isFilmComplete(film) 
                          ? handleStatusChange(film.id, 'published')
                          : handleStatusChange(film.id, 'published')
                        }
                        className={`${
                          isFilmComplete(film)
                            ? 'bg-green-50 text-green-600 hover:bg-green-100'
                            : 'bg-red-50 text-red-600 border-red-100 opacity-80'
                        }`}
                        disabled={false}
                        title={
                          !isFilmComplete(film)
                            ? 'Click to see missing fields'
                            : 'Publish film'
                        }
                      >
                        {!isFilmComplete(film) ? (
                          <span className="flex items-center gap-1">
                            <RiErrorWarningLine className="w-4 h-4" />
                            Incomplete
                          </span>
                        ) : (
                          'Publish'
                        )}
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
            couple_names: editingFilm.couple_names,
            wedding_date: editingFilm.wedding_date,
            location: editingFilm.location,
            description: editingFilm.description,
            video_url: editingFilm.video_url,
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

      {showMissingFieldsModal && selectedFilm && (
        <ConfirmModal
          title="Incomplete Film"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">The following fields are required before publishing:</p>
              <ul className="list-disc list-inside space-y-2 text-red-600">
                {selectedFilm.missingFields?.map((field, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <RiErrorWarningLine className="flex-shrink-0" />
                    {field}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-4">Click Edit to complete these fields.</p>
            </div>
          }
          confirmLabel="Edit Film"
          onConfirm={() => {
            setShowMissingFieldsModal(false);
            setEditingFilm(selectedFilm);
            setShowForm(true);
          }}
          onCancel={() => {
            setShowMissingFieldsModal(false);
            setSelectedFilm(null);
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
        />
      )}

      {previewVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90"
          onClick={() => setPreviewVideo(null)}
        >
          <button
            onClick={() => setPreviewVideo(null)}
            className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
            aria-label="Close preview"
          >
            <RiCloseLine className="w-8 h-8" />
          </button>
          <div 
            className="w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-4xl aspect-video">
              <VideoPreview url={previewVideo} autoPlay={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoPreview({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) {
  const videoInfo = getVideoId(url);
  
  if (!videoInfo) return null;

  let embedUrl = '';
  if (videoInfo.type === 'youtube') {
    embedUrl = `https://www.youtube.com/embed/${videoInfo.id}${autoPlay ? '?autoplay=1' : ''}`;
  } else if (videoInfo.type === 'vimeo') {
    embedUrl = `https://player.vimeo.com/video/${videoInfo.id}${autoPlay ? '?autoplay=1' : ''}`;
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

function getVideoId(url: string) {
  try {
    // YouTube URL patterns
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return { type: 'youtube', id: youtubeMatch[1] };

    // Vimeo URL patterns
    const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|))(\d+)(?:[a-zA-Z0-9_\-]+)?/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch) return { type: 'vimeo', id: vimeoMatch[1] };

    return null;
  } catch (error) {
    return null;
  }
} 