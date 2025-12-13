'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import OrderedList from '@tiptap/extension-ordered-list'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Enter content...' }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable link and underline from StarterKit to avoid duplicates
        link: false,
        underline: false,
        // Disable orderedList from StarterKit so we can configure it separately
        orderedList: false,
      }),
      // Configure OrderedList without auto-detection input rules
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal',
        },
      }).extend({
        addInputRules() {
          // Return empty array to disable auto-detection of numbered lists
          return []
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-electric-blue hover:text-[#00B8E6] underline',
        },
      }),
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[200px] px-4 py-3 text-white',
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
  })

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="rich-text-editor border border-bg-tertiary rounded-lg bg-bg-tertiary overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-bg-tertiary bg-bg-secondary">
        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-bg-tertiary mx-1" />

        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('bold')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('italic')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('underline')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Underline"
        >
          <u>U</u>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('strike')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="w-px h-6 bg-bg-tertiary mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Bullet List"
        >
          •
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Numbered List"
        >
          1.
        </button>
        <button
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('taskList')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Checklist"
        >
          ✓
        </button>

        <div className="w-px h-6 bg-bg-tertiary mx-1" />

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
            editor.isActive('link')
              ? 'bg-electric-blue text-black'
              : 'bg-bg-tertiary text-white hover:bg-bg-tertiary/80'
          }`}
          title="Add Link"
        >
          🔗
        </button>
        {editor.isActive('link') && (
          <button
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-bg-tertiary text-white hover:bg-bg-tertiary/80 transition-colors"
            title="Remove Link"
          >
            Unlink
          </button>
        )}

        <div className="flex-1" />

        {/* Clear Formatting */}
        <button
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          className="px-3 py-1.5 rounded text-sm font-semibold bg-bg-tertiary text-white hover:bg-bg-tertiary/80 transition-colors"
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor Content */}
      <div className="p-4 relative">
        <EditorContent editor={editor} />
        {!editor.getText() && (
          <div className="absolute top-4 left-4 pointer-events-none text-text-secondary">
            {placeholder}
          </div>
        )}
      </div>
      
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          outline: none;
          min-height: 200px;
        }
        .rich-text-editor .ProseMirror p {
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror p:first-child {
          margin-top: 0;
        }
        .rich-text-editor .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .rich-text-editor .ProseMirror ul[data-type="taskList"] {
          padding-left: 0;
          margin: 0.5em 0;
          list-style: none;
        }
        .rich-text-editor .ProseMirror li[data-type="taskItem"] {
          display: flex;
          align-items: flex-start;
          gap: 0.5em;
          margin: 0.25em 0;
        }
        .rich-text-editor .ProseMirror li[data-type="taskItem"] > label {
          display: flex;
          align-items: center;
          cursor: pointer;
          user-select: none;
          flex-shrink: 0;
        }
        .rich-text-editor .ProseMirror li[data-type="taskItem"] > label > input[type="checkbox"] {
          width: 1.2em;
          height: 1.2em;
          cursor: pointer;
          margin: 0;
          accent-color: #00d9ff;
          flex-shrink: 0;
        }
        .rich-text-editor .ProseMirror li[data-type="taskItem"] > div {
          flex: 1;
        }
        .rich-text-editor .ProseMirror li[data-type="taskItem"][data-checked="true"] > div {
          text-decoration: line-through;
          opacity: 0.7;
        }
        .rich-text-editor .ProseMirror h1,
        .rich-text-editor .ProseMirror h2,
        .rich-text-editor .ProseMirror h3 {
          margin: 0.75em 0 0.5em 0;
          font-weight: bold;
        }
        .rich-text-editor .ProseMirror h1 {
          font-size: 1.5em;
        }
        .rich-text-editor .ProseMirror h2 {
          font-size: 1.3em;
        }
        .rich-text-editor .ProseMirror h3 {
          font-size: 1.1em;
        }
        .rich-text-editor .ProseMirror a {
          color: #00d9ff;
          text-decoration: underline;
        }
        .rich-text-editor .ProseMirror a:hover {
          color: #00b8e6;
        }
        .rich-text-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1em 0;
        }
        .rich-text-editor .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid #00d9ff;
        }
      `}</style>
    </div>
  )
}

