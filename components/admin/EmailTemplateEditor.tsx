'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import OrderedList from '@tiptap/extension-ordered-list'
import { useEffect, useState } from 'react'

interface EmailTemplateEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  availablePlaceholders?: string[]
}

const COMMON_EMOJIS = ['🎉', '✅', '❌', '📧', '💼', '🚀', '⭐', '🎯', '💡', '🔥', '👍', '👎', '😊', '😢', '🎊', '🎁', '📝', '🔔', '💰', '📊']

export function EmailTemplateEditor({ 
  value, 
  onChange, 
  placeholder = 'Enter email content...',
  availablePlaceholders = []
}: EmailTemplateEditorProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showPlaceholderPicker, setShowPlaceholderPicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
        orderedList: false,
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal',
        },
      }).extend({
        addInputRules() {
          return []
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Underline,
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3 text-white',
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const insertEmoji = (emoji: string) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji).run()
      setShowEmojiPicker(false)
    }
  }

  const insertPlaceholder = (placeholder: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${placeholder}}}`).run()
      setShowPlaceholderPicker(false)
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="email-template-editor border border-bg-tertiary rounded-lg bg-bg-tertiary overflow-hidden">
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

        <div className="w-px h-6 bg-bg-tertiary mx-1" />

        {/* Emoji Picker */}
        <div className="relative">
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker)
              setShowPlaceholderPicker(false)
            }}
            className="px-3 py-1.5 rounded text-sm font-semibold bg-bg-tertiary text-white hover:bg-bg-tertiary/80 transition-colors"
            title="Insert Emoji"
          >
            😀
          </button>
          {showEmojiPicker && (
            <div className="absolute top-full left-0 mt-2 bg-bg-secondary border border-bg-tertiary rounded-lg p-3 shadow-lg z-[100] w-64 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-5 gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="text-2xl hover:bg-bg-tertiary rounded p-2 transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Placeholder Picker */}
        {availablePlaceholders.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowPlaceholderPicker(!showPlaceholderPicker)
                setShowEmojiPicker(false)
              }}
              className="px-3 py-1.5 rounded text-sm font-semibold bg-bg-tertiary text-white hover:bg-bg-tertiary/80 transition-colors"
              title="Insert Placeholder"
            >
              {`{{...}}`}
            </button>
            {showPlaceholderPicker && (
              <div className="absolute top-full left-0 mt-2 bg-bg-secondary border border-bg-tertiary rounded-lg p-3 shadow-lg z-[100] min-w-48">
                <div className="space-y-1">
                  {availablePlaceholders.map((placeholder) => (
                    <button
                      key={placeholder}
                      onClick={() => insertPlaceholder(placeholder)}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-bg-tertiary rounded transition-colors"
                    >
                      {`{{${placeholder}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      {/* Close pickers when clicking outside */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
      {showPlaceholderPicker && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setShowPlaceholderPicker(false)}
        />
      )}
      
      <style jsx global>{`
        .email-template-editor .ProseMirror {
          outline: none;
          min-height: 300px;
        }
        .email-template-editor .ProseMirror p {
          margin: 0.5em 0;
        }
        .email-template-editor .ProseMirror p:first-child {
          margin-top: 0;
        }
        .email-template-editor .ProseMirror p:last-child {
          margin-bottom: 0;
        }
        .email-template-editor .ProseMirror ul,
        .email-template-editor .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .email-template-editor .ProseMirror h1,
        .email-template-editor .ProseMirror h2,
        .email-template-editor .ProseMirror h3 {
          margin: 0.75em 0 0.5em 0;
          font-weight: bold;
        }
        .email-template-editor .ProseMirror h1 {
          font-size: 1.5em;
        }
        .email-template-editor .ProseMirror h2 {
          font-size: 1.3em;
        }
        .email-template-editor .ProseMirror h3 {
          font-size: 1.1em;
        }
        .email-template-editor .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .email-template-editor .ProseMirror a:hover {
          color: #2563eb;
        }
      `}</style>
    </div>
  )
}

