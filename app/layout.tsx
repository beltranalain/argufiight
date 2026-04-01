import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import Script from 'next/script';
import './globals.css';

const GA_MEASUREMENT_ID = 'G-HC5T282D74';

const inter = Inter({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ArguFight — AI-Judged Debate Platform',
    template: '%s | ArguFight',
  },
  description: 'The premier AI-judged debate platform. Challenge opponents to real-time debates, earn championship belts, climb ELO rankings, and prove your argumentation skills. Fair, unbiased AI judges evaluate logic, facts, and rhetoric.',
  keywords: ['debate', 'argumentation', 'competitive debate', 'online debate', 'AI judge', 'debate platform', 'ELO ranking', 'debate tournament'],
  authors: [{ name: 'ArguFight' }],
  creator: 'ArguFight',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.argufight.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.argufight.com',
    siteName: 'ArguFight',
    title: 'ArguFight — AI-Judged Debate Platform',
    description: 'The premier AI-judged debate platform. Challenge opponents, earn championship belts, and prove your argumentation skills.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ArguFight — AI-Judged Debate Platform',
    description: 'The premier AI-judged debate platform. Challenge opponents, earn championship belts, and prove your argumentation skills.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={['dark', 'light']}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
