'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { RiBold, RiItalic, RiListOrdered, RiListUnordered } from 'react-icons/ri';

interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MenuBar = ({ editor }: any) => {
  if (!editor) {
    return null;
  }

  const handleButtonClick = (e: React.MouseEvent, callback: () => boolean) => {
    e.preventDefault(); // Prevent form submission
    callback();
  };

  return (
    <div className="border-b p-2 flex gap-2 flex-wrap sticky top-0 bg-white z-10">
      <button
        type="button"
        onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBold().run())}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
        title="Bold"
      >
        <RiBold />
      </button>
      <button
        type="button"
        onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleItalic().run())}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
        title="Italic"
      >
        <RiItalic />
      </button>
      <button
        type="button"
        onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleBulletList().run())}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-100' : ''}`}
        title="Bullet List"
      >
        <RiListUnordered />
      </button>
      <button
        type="button"
        onClick={(e) => handleButtonClick(e, () => editor.chain().focus().toggleOrderedList().run())}
        className={`p-2 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-100' : ''}`}
        title="Ordered List"
      >
        <RiListOrdered />
      </button>
    </div>
  );
};

export default function TextEditor({ value, onChange }: TextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit.configure({
      heading: false, // Disable heading functionality
    })],
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

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
} 