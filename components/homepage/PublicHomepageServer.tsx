import Link from 'next/link'
import Image from 'next/image'
import { SocialMediaIcon } from '@/components/ui/SocialMediaIcon'
import { prisma } from '@/lib/db/prisma'

interface SocialMediaLink {
  platform: string
  url: string
}

const PLATFORM_LABELS: Record<string, string> = {
  FACEBOOK: 'Facebook',
  TWITTER: 'X',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  YOUTUBE: 'YouTube',
  TIKTOK: 'TikTok',
}

interface HomepageSection {
  id: string
  key: string
  title: string | null
  content: string | null
  order: number
  isVisible: boolean
  contactEmail: string | null
  images: Array<{
    id: string
    url: string
    alt: string | null
    caption: string | null
    linkUrl: string | null
    order: number
  }>
  buttons: Array<{
    id: string
    text: string
    url: string | null
    variant: string
    order: number
    isVisible: boolean
  }>
}

interface PublicHomepageServerProps {
  sections: HomepageSection[]
}

export async function PublicHomepageServer({ sections }: PublicHomepageServerProps) {
  // Fetch social media links server-side (with error handling)
  let socialMediaSettings: any[] = []
  try {
    socialMediaSettings = await prisma.socialMediaLink.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
  } catch (error: any) {
    console.error('[PublicHomepageServer] Failed to fetch social media links:', error.message)
    // Continue with empty array - footer will render without social links
  }

  const socialLinks: SocialMediaLink[] = socialMediaSettings.map(setting => ({
    platform: setting.platform,
    url: setting.url,
  }))

  // Sort sections by order
  const sortedSections = [...sections].sort((a, b) => a.order - b.order)

  // If no sections (database unavailable), show default fallback content
  const hasContent = sortedSections.length > 0

  // Get base URL for structured data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.argufight.com'

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Argufight",
    "description": "AI-judged debate platform where users can debate any topic with 7 unique AI judge personalities",
    "url": baseUrl,
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "847",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "7 unique AI judge personalities",
      "ELO ranking system",
      "Tournament mode",
      "Real-time debate scoring",
      "Public debate sharing"
    ]
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950 relative overflow-hidden">
        {/* Consistent starry background */}
        <div className="fixed inset-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-purple-950/80 backdrop-blur-md border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-electric-blue">
                  ARGU FIGHT
                </Link>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <Link
                  href="/blog"
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-text-primary hover:text-electric-blue transition-colors font-medium"
                >
                  Blog
                </Link>
                <Link
                  href="/leaderboard"
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-text-primary hover:text-electric-blue transition-colors font-medium"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/login"
                  className="px-3 py-2 md:px-4 md:py-2 text-sm md:text-base text-text-primary hover:text-electric-blue transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 md:px-6 md:py-2 text-sm md:text-base bg-electric-blue text-black rounded-lg font-semibold hover:bg-[#00B8E6] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        {hasContent && sortedSections.find(s => s.key === 'hero' && s.isVisible) && (
          <HeroSection section={sortedSections.find(s => s.key === 'hero' && s.isVisible)!} />
        )}

        {/* Fallback Hero if no content from database */}
        {!hasContent && (
          <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-purple-950 via-purple-900 to-indigo-950">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
                Welcome to <span className="text-blue-400">Argufight</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                AI-Judged Debate Platform - Win Debates with 7 AI Judges
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/login"
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/signup"
                  className="px-8 py-4 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  Sign Up
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Other Sections */}
        {hasContent && (
          <div className="pt-20 pb-32">
            {sortedSections
              .filter(s => s.key !== 'hero' && s.key !== 'footer' && s.key !== 'app-download' && s.isVisible)
              .map((section, index) => (
                <HomepageSectionComponent key={section.id} section={section} index={index} />
              ))}
          </div>
        )}

        {/* App Download Section */}
        {hasContent && sortedSections.find(s => s.key === 'app-download' && s.isVisible) && (
          <AppDownloadSection section={sortedSections.find(s => s.key === 'app-download' && s.isVisible)!} />
        )}

        {/* Footer */}
        <FooterSection section={sortedSections.find(s => s.key === 'footer' && s.isVisible)} socialLinks={socialLinks} />
      </div>
    </>
  )
}

function HeroSection({ section }: { section: HomepageSection }) {
  const heroImage = section.images.find(img => img.order === 0)
  const primaryButton = section.buttons.find(btn => btn.variant === 'primary' && btn.isVisible)
  const secondaryButton = section.buttons.find(btn => btn.variant === 'secondary' && btn.isVisible)

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {section.title && (
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-text-primary mb-6 leading-tight">
            {section.title}
          </h1>
        )}
        {section.content && (
          <div
            className="text-xl md:text-2xl text-text-primary/90 mb-10 prose prose-invert max-w-none prose-p:text-text-primary/90"
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {primaryButton && (
            <Link
              href={primaryButton.url || '/signup'}
              className="px-8 py-4 bg-electric-blue text-black rounded-xl font-semibold text-lg hover:bg-[#00B8E6] transition-all transform hover:scale-105 shadow-lg shadow-electric-blue/50"
            >
              {primaryButton.text}
            </Link>
          )}
          {secondaryButton && (
            <Link
              href={secondaryButton.url || '/login'}
              className="px-8 py-4 border-2 border-electric-blue text-electric-blue rounded-xl font-semibold text-lg hover:bg-electric-blue/10 transition-all transform hover:scale-105"
            >
              {secondaryButton.text}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function HomepageSectionComponent({ section, index }: { section: HomepageSection; index: number }) {
  const sectionImages = Array.isArray(section.images) 
    ? [...section.images].sort((a, b) => a.order - b.order)
    : []
  const sectionButtons = [...section.buttons]
    .filter(btn => btn.isVisible)
    .sort((a, b) => a.order - b.order)

  // Determine layout: right, left, right pattern
  const isImageRight = index % 2 === 0
  const primaryImage = sectionImages[0]

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="relative rounded-3xl border border-white/20 bg-purple-900/30 backdrop-blur-md p-8 md:p-12 shadow-2xl">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center ${
            isImageRight ? '' : 'lg:grid-flow-dense'
          }`}>
            {/* Image Block */}
            {primaryImage && (
              <div className={`relative ${
                isImageRight ? 'lg:order-2' : 'lg:order-1'
              }`}>
                <div className="relative min-h-[300px] rounded-2xl overflow-hidden border border-white/20">
                  {primaryImage.url.startsWith('data:') ? (
                    <img
                      src={primaryImage.url}
                      alt={primaryImage.alt || section.title || ''}
                      className="w-full h-auto object-contain"
                    />
                  ) : (
                    <div className="relative w-full" style={{ aspectRatio: 'auto' }}>
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt || section.title || ''}
                        width={800}
                        height={600}
                        className="w-full h-auto object-contain"
                        priority={index === 0}
                        unoptimized={primaryImage.url.includes('blob.vercel-storage.com') || primaryImage.url.startsWith('data:')}
                      />
                    </div>
                  )}
                  {primaryImage.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 text-text-primary text-sm">
                      {primaryImage.caption}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Block */}
            <div className={`flex flex-col justify-center ${isImageRight ? 'lg:order-1' : 'lg:order-2'}`}>
              {section.title && (
                <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-6 leading-tight">
                  {section.title}
                </h2>
              )}
              {section.content && (
                <div
                  className="text-base md:text-lg text-text-primary/90 mb-8 prose prose-invert max-w-none prose-headings:text-text-primary prose-p:text-text-primary/90 prose-a:text-electric-blue prose-a:no-underline hover:prose-a:underline prose-strong:text-text-primary prose-ul:text-text-primary/90 prose-li:text-text-primary/90"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
              {sectionButtons.length > 0 && (
                <div className="flex flex-wrap gap-4">
                  {sectionButtons.map((button) => (
                    <Link
                      key={button.id}
                      href={button.url || '#'}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                        button.variant === 'primary'
                          ? 'bg-electric-blue text-black hover:bg-[#00B8E6] shadow-lg shadow-electric-blue/50'
                          : 'border-2 border-electric-blue text-electric-blue hover:bg-electric-blue/10'
                      }`}
                    >
                      {button.text}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Images Grid */}
        {sectionImages.length > 1 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
            {sectionImages.slice(1).map((image) => (
              <div key={image.id} className="relative rounded-xl overflow-hidden border border-white/20">
                {image.url.includes('blob.vercel-storage.com') || image.url.startsWith('data:') ? (
                  <img
                    src={image.url}
                    alt={image.alt || ''}
                    className="w-full h-auto object-contain"
                  />
                ) : (
                  <Image
                    src={image.url}
                    alt={image.alt || ''}
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AppDownloadSection({ section }: { section: HomepageSection }) {
  const appStoreButton = section.buttons.find(btn => btn.variant === 'app-store' && btn.isVisible)
  const googlePlayButton = section.buttons.find(btn => btn.variant === 'google-play' && btn.isVisible)
  
  const sortedImages = [...section.images].sort((a, b) => a.order - b.order)
  
  const appStoreImage = sortedImages.find(img => {
    const altLower = img.alt?.toLowerCase() || ''
    return altLower.includes('app store') || 
           altLower.includes('apple') ||
           altLower.includes('appstore') ||
           img.order === 0
  })
  
  const googlePlayImage = sortedImages.find(img => {
    if (img.id === appStoreImage?.id) return false
    const altLower = img.alt?.toLowerCase() || ''
    return altLower.includes('google play') || 
           altLower.includes('google') ||
           altLower.includes('play store') ||
           (appStoreImage?.order === 0 && img.order === 1) ||
           (!appStoreImage && img.order === 0) ||
           (appStoreImage && img.order === 1)
  })

  const hasAppStore = appStoreButton || appStoreImage
  const hasGooglePlay = googlePlayButton || googlePlayImage

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl border border-white/20 bg-purple-900/30 backdrop-blur-md p-8 md:p-12 shadow-2xl text-center">
          {section.title && (
            <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-6">
              {section.title}
            </h2>
          )}
          {section.content && (
            <div
              className="text-base md:text-lg text-text-primary/90 mb-10 prose prose-invert max-w-none prose-p:text-text-primary/90"
              dangerouslySetInnerHTML={{ __html: section.content }}
            />
          )}
          
          {(hasAppStore || hasGooglePlay) && (
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {hasAppStore && (
                <>
                  {appStoreImage ? (
                    (appStoreImage.linkUrl || appStoreButton?.url) ? (
                      <Link
                        href={appStoreImage.linkUrl || appStoreButton?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-all transform hover:scale-105"
                      >
                        <div className="relative w-48 h-14 md:w-56 md:h-16">
                          <Image
                            src={appStoreImage.url}
                            alt={appStoreImage.alt || 'Download on the App Store'}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="relative w-48 h-14 md:w-56 md:h-16">
                        <Image
                          src={appStoreImage.url}
                          alt={appStoreImage.alt || 'Download on the App Store'}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )
                  ) : (
                    appStoreButton?.url ? (
                      <Link
                        href={appStoreButton.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-all transform hover:scale-105"
                      >
                        <div className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:border-electric-blue transition-colors">
                          {appStoreButton.text || 'Download on the App Store'}
                        </div>
                      </Link>
                    ) : (
                      <div className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg border-2 border-white/20">
                        {appStoreButton?.text || 'Download on the App Store'}
                      </div>
                    )
                  )}
                </>
              )}
              
              {hasGooglePlay && (
                <>
                  {googlePlayImage ? (
                    (googlePlayImage.linkUrl || googlePlayButton?.url) ? (
                      <Link
                        href={googlePlayImage.linkUrl || googlePlayButton?.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-all transform hover:scale-105"
                      >
                        <div className="relative w-48 h-14 md:w-56 md:h-16">
                          <Image
                            src={googlePlayImage.url}
                            alt={googlePlayImage.alt || 'Get it on Google Play'}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="relative w-48 h-14 md:w-56 md:h-16">
                        <Image
                          src={googlePlayImage.url}
                          alt={googlePlayImage.alt || 'Get it on Google Play'}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )
                  ) : (
                    googlePlayButton?.url ? (
                      <Link
                        href={googlePlayButton.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-all transform hover:scale-105"
                      >
                        <div className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg border-2 border-white/20 hover:border-electric-blue transition-colors">
                          {googlePlayButton.text || 'Get it on Google Play'}
                        </div>
                      </Link>
                    ) : (
                      <div className="px-8 py-4 bg-black text-white rounded-xl font-semibold text-lg border-2 border-white/20">
                        {googlePlayButton?.text || 'Get it on Google Play'}
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function FooterSection({ section, socialLinks }: { section: HomepageSection | undefined; socialLinks: SocialMediaLink[] }) {
  return (
    <footer className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-6">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-6">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/online-debate-platform" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Online Debate Platform
                </Link>
              </li>
              <li>
                <Link href="/debate-practice" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Debate Practice
                </Link>
              </li>
              <li>
                <Link href="/ai-debate" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  AI Debate
                </Link>
              </li>
              <li>
                <Link href="/debate-simulator" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Debate Simulator
                </Link>
              </li>
              <li>
                <Link href="/argument-checker" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Argument Checker
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-6">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-primary/80 hover:text-text-primary transition-colors text-base">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-text-primary font-semibold text-lg mb-6">Contact</h3>
            <p className="text-text-primary/80 text-base mb-4">
              {section?.contactEmail || 'info@argufight.com'}
            </p>
            
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-text-primary/80 hover:text-text-primary"
                    title={PLATFORM_LABELS[link.platform] || link.platform}
                  >
                    <SocialMediaIcon platform={link.platform} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center text-text-primary/60 text-sm pt-8 border-t border-text-primary/10">
          <p>
            &copy; {new Date().getFullYear()} {section?.content || 'Argu Fight. All rights reserved.'}
          </p>
        </div>
      </div>
    </footer>
  )
}

