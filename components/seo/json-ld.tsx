type JsonLdData = Record<string, unknown>;

export function JsonLd({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com';

export const organizationJsonLd: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ArguFight',
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  description: 'The premier AI-judged debate platform. Challenge opponents, earn championship belts, and prove your argumentation skills.',
  sameAs: [],
};

export const websiteJsonLd: JsonLdData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ArguFight',
  url: BASE_URL,
  description: 'AI-judged competitive debate platform with ELO rankings, tournaments, and championship belts.',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${BASE_URL}/trending?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export function createWebPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: opts.name,
    description: opts.description,
    url: `${BASE_URL}${opts.path}`,
    isPartOf: { '@type': 'WebSite', name: 'ArguFight', url: BASE_URL },
  };
}

export function createFAQJsonLd(questions: { question: string; answer: string }[]): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
