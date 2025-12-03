'use client'

import { useEffect } from 'react'

interface RichTextContentProps {
  content: string
}

export function RichTextContent({ content }: RichTextContentProps) {
  useEffect(() => {
    // Inject styles if not already present
    if (typeof document !== 'undefined' && !document.getElementById('legal-content-styles')) {
      const style = document.createElement('style')
      style.id = 'legal-content-styles'
      style.textContent = `
        .legal-content {
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.75;
        }
        
        .legal-content h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin-top: 2.5rem;
          margin-bottom: 1.5rem;
          line-height: 1.2;
          color: white;
        }
        
        .legal-content h2 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.3;
          color: white;
        }
        
        .legal-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.4;
          color: white;
        }
        
        .legal-content h4 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: white;
        }
        
        .legal-content p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .legal-content p:first-child {
          margin-top: 0;
        }
        
        .legal-content p:last-child {
          margin-bottom: 0;
        }
        
        .legal-content ul,
        .legal-content ol {
          margin-bottom: 1.25rem;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .legal-content ul {
          list-style-type: disc;
        }
        
        .legal-content ol {
          list-style-type: decimal;
        }
        
        .legal-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .legal-content li:last-child {
          margin-bottom: 0;
        }
        
        .legal-content strong,
        .legal-content b {
          font-weight: 700;
          color: white;
        }
        
        .legal-content em,
        .legal-content i {
          font-style: italic;
        }
        
        .legal-content u {
          text-decoration: underline;
        }
        
        .legal-content s {
          text-decoration: line-through;
        }
        
        .legal-content a {
          color: #00d9ff;
          text-decoration: none;
        }
        
        .legal-content a:hover {
          color: #00b8e6;
          text-decoration: underline;
        }
        
        .legal-content blockquote {
          border-left: 4px solid #00d9ff;
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .legal-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem 0;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  return (
    <div
      className="legal-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

