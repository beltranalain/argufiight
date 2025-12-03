import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Footer Links Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Platform Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Platform</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-white/80 hover:text-white transition-colors text-base">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-white/80 hover:text-white transition-colors text-base">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-white/80 hover:text-white transition-colors text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/80 hover:text-white transition-colors text-base">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contact</h3>
            <p className="text-white/80 text-base">support@honorable.ai</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-white/60 text-sm pt-8 border-t border-white/10">
          <p>&copy; {new Date().getFullYear()} Honorable AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

