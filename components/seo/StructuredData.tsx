/**
 * JSON-LD Structured Data Components for SEO
 * Provides Schema.org markup for better search engine understanding
 */

import { ReactElement } from 'react'

// Base interface for all structured data
interface StructuredDataProps {
  data: Record<string, any>
}

/**
 * Generic Structured Data Component
 * Renders JSON-LD script tag with provided schema data
 */
export function StructuredData({ data }: StructuredDataProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  )
}

/**
 * Organization Schema
 * Used in root layout to identify the website/company
 */
export interface OrganizationSchemaProps {
  name: string
  url: string
  logo?: string
  description?: string
  sameAs?: string[] // Social media URLs
  contactPoint?: {
    email?: string
    contactType?: string
  }
}

export function OrganizationSchema(props: OrganizationSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: props.name,
    url: props.url,
    ...(props.logo && { logo: props.logo }),
    ...(props.description && { description: props.description }),
    ...(props.sameAs && props.sameAs.length > 0 && { sameAs: props.sameAs }),
    ...(props.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        email: props.contactPoint.email,
        contactType: props.contactPoint.contactType || 'customer service',
      },
    }),
  }

  return <StructuredData data={schema} />
}

/**
 * Debate Schema (using Article schema as base)
 * Used on debate detail pages
 */
export interface DebateSchemaProps {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  opponent?: {
    name: string
    url?: string
  }
  image?: string
  status?: string
  category?: string
}

export function DebateSchema(props: DebateSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: props.title,
    description: props.description,
    url: props.url,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    ...(props.image && { image: props.image }),
    author: [
      {
        '@type': 'Person',
        name: props.author.name,
        ...(props.author.url && { url: props.author.url }),
      },
      ...(props.opponent
        ? [
            {
              '@type': 'Person',
              name: props.opponent.name,
              ...(props.opponent.url && { url: props.opponent.url }),
            },
          ]
        : []),
    ],
    ...(props.category && {
      about: {
        '@type': 'Thing',
        name: props.category,
      },
    }),
    discussionUrl: props.url,
    commentCount: 0, // Can be updated with actual comment count
  }

  return <StructuredData data={schema} />
}

/**
 * Breadcrumb Schema
 * Used for navigation paths
 */
export interface BreadcrumbItem {
  name: string
  url: string
}

export interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <StructuredData data={schema} />
}

/**
 * Person Schema
 * Used on user profile pages
 */
export interface PersonSchemaProps {
  name: string
  url: string
  image?: string
  description?: string
  sameAs?: string[] // Social media profiles
  jobTitle?: string
  affiliation?: string
}

export function PersonSchema(props: PersonSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: props.name,
    url: props.url,
    ...(props.image && { image: props.image }),
    ...(props.description && { description: props.description }),
    ...(props.sameAs && props.sameAs.length > 0 && { sameAs: props.sameAs }),
    ...(props.jobTitle && { jobTitle: props.jobTitle }),
    ...(props.affiliation && {
      affiliation: {
        '@type': 'Organization',
        name: props.affiliation,
      },
    }),
  }

  return <StructuredData data={schema} />
}

/**
 * Tournament Event Schema
 * Used on tournament pages
 */
export interface TournamentSchemaProps {
  name: string
  description: string
  url: string
  startDate: string
  endDate?: string
  location?: string
  organizer: string
  participants?: number
  image?: string
  status?: string
}

export function TournamentSchema(props: TournamentSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: props.name,
    description: props.description,
    url: props.url,
    startDate: props.startDate,
    ...(props.endDate && { endDate: props.endDate }),
    ...(props.image && { image: props.image }),
    eventStatus:
      props.status === 'COMPLETED'
        ? 'https://schema.org/EventScheduled'
        : props.status === 'ACTIVE'
        ? 'https://schema.org/EventScheduled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: props.url,
    },
    organizer: {
      '@type': 'Organization',
      name: props.organizer,
    },
    ...(props.participants && {
      maximumAttendeeCapacity: props.participants,
    }),
  }

  return <StructuredData data={schema} />
}

/**
 * Blog Post Schema
 * Used on blog article pages
 */
export interface BlogPostSchemaProps {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  image?: string
  category?: string
  tags?: string[]
}

export function BlogPostSchema(props: BlogPostSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: props.title,
    description: props.description,
    url: props.url,
    datePublished: props.datePublished,
    dateModified: props.dateModified || props.datePublished,
    ...(props.image && { image: props.image }),
    author: {
      '@type': 'Person',
      name: props.author.name,
      ...(props.author.url && { url: props.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'ArguFight',
      url: 'https://www.argufight.com',
    },
    ...(props.category && {
      articleSection: props.category,
    }),
    ...(props.tags &&
      props.tags.length > 0 && {
        keywords: props.tags.join(', '),
      }),
  }

  return <StructuredData data={schema} />
}

/**
 * FAQ Schema
 * Used on FAQ or help pages
 */
export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSchemaProps {
  items: FAQItem[]
}

export function FAQSchema({ items }: FAQSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return <StructuredData data={schema} />
}

/**
 * Debate Discussion Schema (using DiscussionForumPosting)
 * More semantically accurate for debates than Article schema
 * Supported by Google since 2024
 */
export interface DebateDiscussionSchemaProps {
  title: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
  opponent?: {
    name: string
    url?: string
  }
  statements?: Array<{
    authorName: string
    authorUrl?: string
    content: string
    round: number
    dateCreated: string
  }>
  category?: string
}

export function DebateDiscussionSchema(props: DebateDiscussionSchemaProps): ReactElement {
  const comments = (props.statements || []).map((s, i) => ({
    '@type': 'Comment',
    'position': i + 1,
    'text': s.content,
    'author': {
      '@type': 'Person',
      'name': s.authorName,
      ...(s.authorUrl && { url: s.authorUrl }),
    },
    'dateCreated': s.dateCreated,
  }))

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    'headline': props.title,
    'text': props.description,
    'url': props.url,
    'datePublished': props.datePublished,
    'dateModified': props.dateModified || props.datePublished,
    'author': {
      '@type': 'Person',
      'name': props.author.name,
      ...(props.author.url && { url: props.author.url }),
    },
    ...(props.category && {
      'about': { '@type': 'Thing', 'name': props.category },
    }),
    ...(comments.length > 0 && { 'comment': comments }),
    'commentCount': comments.length,
    'interactionStatistic': {
      '@type': 'InteractionCounter',
      'interactionType': 'https://schema.org/CommentAction',
      'userInteractionCount': comments.length,
    },
  }

  return <StructuredData data={schema} />
}

/**
 * Website Search Schema
 * Used in root layout to enable search box in Google results
 */
export interface WebsiteSearchSchemaProps {
  url: string
  searchUrl: string
}

export function WebsiteSearchSchema(props: WebsiteSearchSchemaProps): ReactElement {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: props.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${props.searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return <StructuredData data={schema} />
}
