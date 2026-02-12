'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  RiBold,
  RiItalic,
  RiListOrdered,
  RiListUnordered,
  RiLinkM,
  RiImageAddLine,
  RiLinkUnlinkM,
} from 'react-icons/ri';
import { useMemo, useState, useEffect } from 'react';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  galleryImages?: string[];
  galleryImageAlts?: { [key: string]: string };
}

const MenuBar = ({ editor, onInsertImage }: any) => {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  if (!editor) {
    return null;
  }

  const handleButtonClick = (e: React.MouseEvent, callback: () => boolean) => {
    e.preventDefault();
    callback();
  };

  const openLinkModal = (e: React.MouseEvent) => {
    e.preventDefault();

    // Check if cursor is on a link
    const attrs = editor.getAttributes('link');

    if (attrs.href) {
      // Editing existing link - extend selection to cover entire link
      editor.chain().focus().extendMarkRange('link').run();

      // Now get the full link text
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');

      setLinkUrl(attrs.href);
      setLinkText(text || '');
    } else {
      // Creating new link - get selected text if any
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, '');
      setLinkUrl('');
      setLinkText(text || '');
    }

    setShowLinkModal(true);
  };

  const insertLink = () => {
    if (!linkUrl) return;

    const attrs = editor.getAttributes('link');
    const isEditingLink = !!attrs.href;

    if (isEditingLink) {
      // Editing existing link
      const displayText = linkText || linkUrl;

      // Extend to select entire link
      editor.chain().focus().extendMarkRange('link').run();
      const { from } = editor.state.selection;

      // Delete old link and insert new one
      editor
        .chain()
        .focus()
        .deleteSelection()
        .insertContentAt(from, [
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: linkUrl } }],
            text: displayText,
          },
          { type: 'text', text: ' ' }, // Space after link (no link mark)
        ])
        .run();
    } else {
      // Insert new link
      const displayText = linkText || linkUrl;
      const { from, to } = editor.state.selection;

      // Delete selection if any
      if (from !== to) {
        editor.chain().focus().deleteSelection().run();
      }

      // Get position after deletion
      const insertPos = editor.state.selection.from;

      // Insert link and space
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, [
          {
            type: 'text',
            marks: [{ type: 'link', attrs: { href: linkUrl } }],
            text: displayText,
          },
          { type: 'text', text: ' ' }, // Space after link (no link mark)
        ])
        .run();
    }

    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const removeLink = (e: React.MouseEvent) => {
    e.preventDefault();
    editor.chain().focus().unsetLink().run();
  };

  return (
    <>
      <div className='p-2 flex gap-2 flex-wrap bg-white'>
        <button
          type='button'
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleBold().run(),
            )
          }
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
          title='Bold'
        >
          <RiBold />
        </button>
        <button
          type='button'
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleItalic().run(),
            )
          }
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
          title='Italic'
        >
          <RiItalic />
        </button>
        <button
          type='button'
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleBulletList().run(),
            )
          }
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100' : ''}`}
          title='Bullet List'
        >
          <RiListUnordered />
        </button>
        <button
          type='button'
          onClick={(e) =>
            handleButtonClick(e, () =>
              editor.chain().focus().toggleOrderedList().run(),
            )
          }
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100' : ''}`}
          title='Ordered List'
        >
          <RiListOrdered />
        </button>

        <div className='w-px h-6 bg-gray-300 mx-1'></div>

        <button
          type='button'
          onClick={openLinkModal}
          className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
          title='Add Link'
        >
          <RiLinkM />
        </button>
        {editor.isActive('link') && (
          <button
            type='button'
            onClick={removeLink}
            className='p-2 rounded hover:bg-gray-100 text-red-600'
            title='Remove Link'
          >
            <RiLinkUnlinkM />
          </button>
        )}

        <button
          type='button'
          onClick={(e) => {
            e.preventDefault();
            onInsertImage();
          }}
          className='p-2 rounded hover:bg-gray-100'
          title='Insert Image'
        >
          <RiImageAddLine />
        </button>
      </div>

      {showLinkModal && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={() => setShowLinkModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowLinkModal(false);
              setLinkUrl('');
              setLinkText('');
            }
          }}
        >
          <div
            className='bg-white rounded-lg p-6 w-full max-w-md shadow-xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-lg font-semibold mb-4'>
              {editor?.getAttributes('link').href ? 'Edit Link' : 'Add Link'}
            </h3>

            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Link Text
                </label>
                <input
                  type='text'
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkUrl) {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                  placeholder='Text to display'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  autoFocus
                />
                <p className='text-xs text-gray-500 mt-1'>
                  Leave empty to use URL as text
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  URL <span className='text-red-500'>*</span>
                </label>
                <input
                  type='url'
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && linkUrl) {
                      e.preventDefault();
                      insertLink();
                    }
                  }}
                  placeholder='https://example.com'
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>
            </div>

            <div className='flex justify-end gap-3 mt-6'>
              <button
                type='button'
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={insertLink}
                disabled={!linkUrl}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {editor?.getAttributes('link').href ? 'Update Link' : 'Insert Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default function TextEditor({
  value,
  onChange,
  galleryImages = [],
  galleryImageAlts = {},
}: TextEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Handle ESC key to close image preview
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImageUrl) {
        setPreviewImageUrl(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImageUrl]);

  const ImageWithPlaceholder = useMemo(() => {
    return Image.extend({
      addNodeView() {
        return ({ node }) => {
          const container = document.createElement('div');
          container.className = 'image-preview-container inline-flex items-center gap-2 my-1 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all cursor-pointer group';
          container.contentEditable = 'false';

          const src = node.attrs.src as string | undefined;
          const alt = node.attrs.alt as string | undefined;

          if (src) {
            // Create thumbnail image
            const thumbnail = document.createElement('img');
            thumbnail.src = src;
            thumbnail.alt = alt || 'Image';
            thumbnail.className = 'w-12 h-12 object-cover rounded border border-gray-200 group-hover:border-gray-300';
            container.appendChild(thumbnail);

            // Create text info
            const textContainer = document.createElement('div');
            textContainer.className = 'flex flex-col min-w-0';

            const altText = document.createElement('span');
            altText.className = 'text-sm font-medium text-gray-700 truncate max-w-[200px]';
            altText.textContent = alt || 'Image';

            const sizeText = document.createElement('span');
            sizeText.className = 'text-xs text-gray-500';
            sizeText.textContent = 'Click to preview';

            textContainer.appendChild(altText);
            textContainer.appendChild(sizeText);
            container.appendChild(textContainer);

            // Click to preview full image
            container.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              setPreviewImageUrl(src);
            });
          } else {
            // Fallback if no src
            const text = document.createElement('span');
            text.className = 'text-sm text-gray-500';
            text.textContent = alt || 'Image (no source)';
            container.appendChild(text);
          }

          return {
            dom: container,
            contentDOM: null,
          };
        };
      },
    }).configure({
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg my-4',
      },
    });
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800 cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      ImageWithPlaceholder,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[200px] px-4 py-2',
      },
    },
  });

  const insertImage = (imageUrl: string) => {
    if (editor && imageUrl) {
      const altText = galleryImageAlts[imageUrl] || '';

      // Insert image and create new paragraph after it
      editor
        .chain()
        .focus()
        .setImage({ src: imageUrl, alt: altText })
        .createParagraphNear() // Creates paragraph after current node
        .run();

      setShowImageModal(false);
    }
  };

  return (
    <div className='border rounded-lg bg-white flex flex-col overflow-hidden'>
      <div className='flex-none border-b bg-gray-50/50 z-20'>
        <MenuBar editor={editor} onInsertImage={() => setShowImageModal(true)} />
      </div>
      <div className='flex-1 overflow-y-auto max-h-[500px] min-h-[300px]'>
        <EditorContent editor={editor} />
      </div>

      {previewImageUrl && (
        <div
          className='fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center'
          onClick={() => setPreviewImageUrl(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setPreviewImageUrl(null);
            }
          }}
          tabIndex={0}
        >
          <button
            type='button'
            onClick={() => setPreviewImageUrl(null)}
            className='absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors'
            aria-label='Close preview'
          >
            ✕
          </button>
          <div
            className='relative w-full h-full max-w-6xl max-h-[85vh] mx-4'
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImageUrl}
              alt='Preview'
              className='w-full h-full object-contain'
            />
          </div>
        </div>
      )}

      {showImageModal && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={() => setShowImageModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowImageModal(false);
            }
          }}
        >
          <div
            className='bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl'
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className='text-lg font-semibold mb-2'>
              Insert Image from Gallery
            </h3>
            <p className='text-sm text-gray-600 mb-4'>
              💡 Tip: Add alt text to images for better descriptions in the
              editor
            </p>

            {galleryImages.length === 0 ? (
              <div className='text-center py-12'>
                <RiImageAddLine className='w-16 h-16 mx-auto text-gray-300 mb-4' />
                <p className='text-gray-500'>No images in gallery yet</p>
                <p className='text-sm text-gray-400 mt-1'>
                  Upload images to the gallery first
                </p>
              </div>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                {galleryImages.map((imageUrl, index) => {
                  const altText = galleryImageAlts[imageUrl];
                  return (
                    <div
                      key={index}
                      className='relative aspect-video rounded-lg overflow-hidden cursor-pointer group border-2 border-transparent hover:border-blue-500 transition-all'
                      onClick={() => insertImage(imageUrl)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          insertImage(imageUrl);
                        }
                      }}
                      tabIndex={0}
                      role='button'
                      aria-label={`Insert ${altText || `image ${index + 1}`}`}
                    >
                      <img
                        src={imageUrl}
                        alt={`Gallery image ${index + 1}`}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-0.5 rounded text-xs'>
                        Image {index + 1}
                      </div>
                      {altText && (
                        <div className='absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-0.5 rounded text-xs truncate max-w-[calc(100%-1rem)]'>
                          {altText}
                        </div>
                      )}
                      <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center'>
                        <span className='text-white opacity-0 group-hover:opacity-100 font-medium'>
                          Insert
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className='flex justify-end mt-6'>
              <button
                type='button'
                onClick={() => setShowImageModal(false)}
                className='px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 