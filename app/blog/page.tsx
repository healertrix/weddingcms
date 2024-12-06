'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { RiAddLine, RiEditLine, RiDeleteBin6Line, RiSearchLine, RiCalendarLine, RiMapPinLine, RiArticleLine, RiZoomInLine, RiCloseLine, RiErrorWarningLine, RiStarLine, RiStarFill, RiHome2Line, RiHome2Fill } from 'react-icons/ri';
import BlogForm, { BlogFormData } from './BlogForm';
import { formatDate } from '../utils/dateFormat';
import ConfirmModal from '../components/ConfirmModal';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';
import { useRouter } from 'next/navigation';
import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';

type BlogStatus = 'draft' | 'published';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  content: string;
  featured_image_key: string | null;
  wedding_date: string | null;
  location: string | null;
  is_featured_home: boolean;
  is_featured_blog: boolean;
  status: BlogStatus;
  missingFields?: string[];
  gallery_images: string[];
};

const formatContent = (content: string) => {
  // Replace italic tags with a special marker
  const withMarkers = content
    .replace(/<i>/g, '{{i}}')
    .replace(/<\/i>/g, '{{/i}}')
    .replace(/<em>/g, '{{i}}')
    .replace(/<\/em>/g, '{{/i}}');

  // Remove other HTML tags but keep our markers
  const strippedContent = withMarkers
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces

  // Truncate if needed (around one line of text)
  let finalContent = strippedContent;
  if (strippedContent.length > 100) {
    // Find the last space before 100 characters
    const lastSpace = strippedContent.substring(0, 100).lastIndexOf(' ');
    finalContent = strippedContent.substring(0, lastSpace);
    // Only add ellipsis if there's more content
    if (strippedContent.length > lastSpace) {
      finalContent += ' ...';
    }
  }

  // Restore italic tags
  return finalContent
    .replace(/{{i}}/g, '<i>')
    .replace(/{{\/i}}/g, '</i>');
};

export default function BlogPage() {
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const POSTS_PER_PAGE = 10;
  const parentRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const from = (page - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      
      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (page === 1) {
        setPosts(data as BlogPost[]);
      } else {
        setPosts(prev => [...prev, ...(data as BlogPost[])]);
      }

      setHasMore(count ? from + POSTS_PER_PAGE < count : false);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setCurrentPage(prev => prev + 1);
      fetchPosts(currentPage + 1);
    }
  }, [isLoading, hasMore, currentPage, fetchPosts]);

  const isPostComplete = (post: BlogPost) => {
    const missingFields = [];
    
    if (!post.title?.trim()) missingFields.push('Title');
    if (!post.slug?.trim()) missingFields.push('Slug');
    if (!post.content?.trim()) missingFields.push('Content');
    if (!post.wedding_date?.trim()) missingFields.push('Wedding Date');
    if (!post.location?.trim()) missingFields.push('Location');
    if (!post.featured_image_key) missingFields.push('Featured Image');
    if (!post.gallery_images || post.gallery_images.length === 0) missingFields.push('Gallery Images');

    post.missingFields = missingFields;
    return missingFields.length === 0;
  };

  const handleStatusChange = async (id: string, newStatus: BlogStatus) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    if (newStatus === 'published' && !isPostComplete(post)) {
      setSelectedPost(post);
      setShowMissingFieldsModal(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === id ? { ...post, status: newStatus } : post
        )
      );
    } catch (error) {
      console.error('Error updating post status:', error);
    }
  };

  const handleDeleteClick = (post: BlogPost) => {
    setDeletingPost(post);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPost) return;
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

      // Delete featured image if it exists
      if (deletingPost.featured_image_key) {
        setDeleteProgress(20);
        const imageResponse = await fetch('/api/upload/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageKey: deletingPost.featured_image_key }),
        });

        if (!imageResponse.ok) {
          throw new Error('Failed to delete featured image from storage');
        }
        setDeleteProgress(40);
      }

      // Delete gallery images if they exist
      if (deletingPost.gallery_images && deletingPost.gallery_images.length > 0) {
        setDeleteProgress(50);
        for (const imageUrl of deletingPost.gallery_images) {
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

      const { error: deleteError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', deletingPost.id);

      if (deleteError) throw deleteError;

      setDeleteProgress(100);

      setTimeout(() => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== deletingPost.id));
        setShowDeleteConfirm(false);
        setDeletingPost(null);
        setDeleteProgress(0);
      }, 500);

    } catch (error) {
      console.error('Error deleting post:', error);
      setDeleteProgress(0);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (data: BlogFormData, saveAsDraft: boolean = false) => {
    try {
      const postData = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        featured_image_key: data.featuredImageUrl || null,
        wedding_date: data.weddingDate || null,
        location: data.location || null,
        is_featured_home: data.isFeaturedHome,
        is_featured_blog: data.isFeaturedBlog,
        gallery_images: data.gallery_images,
        status: saveAsDraft ? 'draft' : 'published'
      };

      if (editingPost) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('blog_posts')
          .insert([postData]);

        if (error) throw error;
      }

      await fetchPosts();
      setShowForm(false);
      setEditingPost(null);
      router.refresh();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleIncompleteClick = (post: BlogPost) => {
    setSelectedPost(post);
    setShowMissingFieldsModal(true);
  };

  const handleFeaturedToggle = async (id: string, type: 'home' | 'blog', currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .update({
          [type === 'home' ? 'is_featured_home' : 'is_featured_blog']: !currentValue
        })
        .eq('id', id);

      if (error) throw error;

      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === id
            ? {
                ...post,
                [type === 'home' ? 'is_featured_home' : 'is_featured_blog']: !currentValue
              }
            : post
        )
      );
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const rowVirtualizer = useVirtualizer({
    count: filteredPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Estimated height of each blog post item
    overscan: 5,
  });

  return (
    <div className='min-h-screen max-h-screen flex flex-col p-8 overflow-hidden'>
      <div className="flex-none">
        <PageHeader
          title="Blog Posts"
          description="Manage your blog posts and stories"
          action={
            <Button icon={RiAddLine} onClick={() => setShowForm(true)}>
              Add Blog Post
            </Button>
          }
        />

        <div className="mt-4 relative">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search blog posts..."
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
              aria-label="Filter blog posts by status"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      <div className='flex-1 bg-white rounded-lg shadow-sm mt-6 overflow-hidden flex flex-col min-h-0'>
        <div 
          ref={parentRef}
          className='flex-1 overflow-y-auto'
          onScroll={(e) => {
            const target = e.target as HTMLDivElement;
            if (
              target.scrollHeight - target.scrollTop <= target.clientHeight * 1.5 &&
              !isLoading &&
              hasMore
            ) {
              loadMore();
            }
          }}
        >
          <div
            className='relative'
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const post = filteredPosts[virtualRow.index];
              return (
                <div
                  key={post.id}
                  className='absolute top-0 left-0 w-full'
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className='p-6'>
                    <div className='flex flex-col md:flex-row gap-6 p-6 bg-white border rounded-xl hover:shadow-md transition-all duration-200'>
                      {post.featured_image_key && (
                        <div className="flex-shrink-0 w-full md:w-64 h-64 md:h-48 relative rounded-lg overflow-hidden group">
                          <Image
                            src={post.featured_image_key}
                            alt={post.title}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            fill
                            sizes="(max-width: 768px) 100vw, 256px"
                            loading="lazy"
                          />
                          <div 
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
                            onClick={() => setPreviewImage(post.featured_image_key)}
                          >
                            <RiZoomInLine className="text-white opacity-0 group-hover:opacity-100 w-8 h-8 transform scale-0 group-hover:scale-100 transition-all duration-300" />
                          </div>
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className='text-xl font-medium text-gray-900'>{post.title}</h3>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                post.status === 'published' 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {post.status === 'published' ? 'Published' : 'Draft'}
                              </span>
                              {post.status === 'published' && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleFeaturedToggle(post.id, 'home', post.is_featured_home)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                                      post.is_featured_home
                                        ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                    title={`${post.is_featured_home ? 'Remove from' : 'Feature on'} home page`}
                                  >
                                    {post.is_featured_home ? <RiHome2Fill /> : <RiHome2Line />}
                                    <span className="text-sm">Home</span>
                                  </button>
                                  <button
                                    onClick={() => handleFeaturedToggle(post.id, 'blog', post.is_featured_blog)}
                                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                                      post.is_featured_blog
                                        ? 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                    }`}
                                    title={`${post.is_featured_blog ? 'Remove from' : 'Feature in'} blog highlights`}
                                  >
                                    {post.is_featured_blog ? <RiStarFill /> : <RiStarLine />}
                                    <span className="text-sm">Featured</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            <div className='flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4'>
                              {post.wedding_date && (
                                <span className="flex items-center">
                                  <RiCalendarLine className="mr-1.5" />
                                  {formatDate(post.wedding_date)}
                                </span>
                              )}
                              {post.location && (
                                <span className="flex items-center">
                                  <RiMapPinLine className="mr-1.5" />
                                  {post.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p 
                          className="text-gray-600 flex-grow mb-4 line-clamp-2"
                          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
                        />

                        <div className="flex items-center gap-3 pt-4 border-t">
                          {post.status === 'draft' ? (
                            <Button
                              variant="secondary"
                              onClick={() => isPostComplete(post) 
                                ? handleStatusChange(post.id, 'published')
                                : handleIncompleteClick(post)
                              }
                              className={`${
                                isPostComplete(post)
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                  : 'bg-red-50 text-red-600 border-red-100 opacity-80'
                              }`}
                              disabled={false}
                              title={
                                !isPostComplete(post)
                                  ? 'Click to see missing fields'
                                  : 'Publish post'
                              }
                            >
                              {!isPostComplete(post) ? (
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
                              onClick={() => handleStatusChange(post.id, 'draft')}
                              className="bg-gray-50 text-gray-600 hover:bg-gray-100"
                            >
                              Unpublish
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            icon={RiEditLine}
                            onClick={() => {
                              setEditingPost(post);
                              setShowForm(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteClick(post)}
                            className="text-red-600 hover:bg-red-50"
                            title="Delete blog post"
                          >
                            <RiDeleteBin6Line />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B4513]"></div>
            </div>
          )}

          {filteredPosts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <RiArticleLine className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-500">No blog posts found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or add a new blog post</p>
            </div>
          )}
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
            <Image
              src={previewImage}
              alt="Full size preview"
              className="object-contain"
              fill
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}

      {showForm && (
        <BlogForm 
          onClose={() => {
            setShowForm(false);
            setEditingPost(null);
          }}
          onSubmit={(data) => handleSubmit(data, false)}
          onSaveAsDraft={(data) => handleSubmit(data, true)}
          initialData={editingPost ? {
            title: editingPost.title,
            slug: editingPost.slug,
            content: editingPost.content,
            featuredImageKey: editingPost.featured_image_key || '',
            featuredImageUrl: editingPost.featured_image_key || '',
            weddingDate: editingPost.wedding_date || '',
            location: editingPost.location || '',
            isFeaturedHome: editingPost.is_featured_home || false,
            isFeaturedBlog: editingPost.is_featured_blog || false,
            gallery_images: editingPost.gallery_images || []
          } : undefined}
        />
      )}

      {showDeleteConfirm && deletingPost && (
        <ConfirmModal
          title="Delete Blog Post"
          message={
            <div className="space-y-4">
              <div className="space-y-4">
                <p>Are you sure you want to delete this blog post?</p>
                <div className="bg-red-50 p-4 rounded-lg space-y-2">
                  <div className="font-medium text-red-800">This will permanently delete:</div>
                  <ul className="list-disc list-inside text-red-700 space-y-1 ml-2">
                    <li>The blog post content</li>
                    {deletingPost.featured_image_key && <li>The featured image</li>}
                    {deletingPost.gallery_images && deletingPost.gallery_images.length > 0 && (
                      <li>All gallery images ({deletingPost.gallery_images.length} images)</li>
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
                    Deleting blog post... {deleteProgress}%
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
              setDeletingPost(null);
            }
          }}
          confirmButtonClassName={`bg-red-600 hover:bg-red-700 text-white ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isDeleting}
        />
      )}

      {showMissingFieldsModal && selectedPost && (
        <ConfirmModal
          title="Incomplete Blog Post"
          message={
            <div className="space-y-4">
              <p className="text-gray-600">The following fields are required before publishing:</p>
              <ul className="list-disc list-inside space-y-2">
                {selectedPost.missingFields?.map((field, index) => (
                  <li key={index} className="flex items-center gap-2 text-red-600">
                    <RiErrorWarningLine className="flex-shrink-0 w-5 h-5" />
                    <span>{field}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-4">Click Edit to complete these fields.</p>
            </div>
          }
          confirmLabel="Edit Post"
          onConfirm={() => {
            setShowMissingFieldsModal(false);
            setEditingPost(selectedPost);
            setShowForm(true);
          }}
          onCancel={() => {
            setShowMissingFieldsModal(false);
            setSelectedPost(null);
          }}
          confirmButtonClassName="bg-[#8B4513] hover:bg-[#693610] text-white"
        />
      )}
    </div>
  );
} 