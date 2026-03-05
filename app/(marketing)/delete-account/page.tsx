import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Delete Account | ArguFight',
  description: 'Request deletion of your ArguFight account and associated data.',
}

export default function DeleteAccountPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-[13px] font-[500] text-accent uppercase tracking-widest mb-4">Account</p>
        <h1 className="text-[40px] font-[700] tracking-[-1.5px] text-text mb-3">
          Delete Your Account
        </h1>
        <p className="text-[14px] text-text-3">How to request account and data deletion</p>
      </div>

      <div className="h-px bg-border mb-10" />

      <div className="prose prose-sm max-w-none text-text-2 space-y-8">
        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">How to Delete Your Account</h2>
          <p className="text-[15px] leading-relaxed mb-3">
            You can permanently delete your ArguFight account and all associated data by following these steps:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-[15px] leading-relaxed text-text-3 ml-2">
            <li>Log in to your ArguFight account at{' '}
              <a href="https://www.argufight.com/login" className="text-accent hover:underline">
                www.argufight.com/login
              </a>
            </li>
            <li>Navigate to{' '}
              <a href="https://www.argufight.com/settings" className="text-accent hover:underline">
                Settings
              </a>
            </li>
            <li>Scroll to the <strong className="text-text">Danger Zone</strong> section at the bottom</li>
            <li>Click <strong className="text-text">Delete account</strong></li>
            <li>Type <strong className="text-text">DELETE</strong> to confirm</li>
            <li>Click <strong className="text-text">Confirm delete</strong></li>
          </ol>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">What Data Is Deleted</h2>
          <p className="text-[15px] leading-relaxed mb-3">
            When you delete your account, the following data is permanently removed:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-text-3 ml-2">
            <li>Your profile information (username, email, bio, avatar)</li>
            <li>Your debate history and statements</li>
            <li>Your direct messages and chat messages</li>
            <li>Your notifications and session data</li>
            <li>Your follows, likes, saves, and shares</li>
            <li>Your tournament participations</li>
            <li>Your coin balance and transaction history</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Data Retention</h2>
          <p className="text-[15px] leading-relaxed">
            Account deletion is processed immediately. All personal data is removed within 30 days.
            Some anonymized, non-personal data (such as aggregate debate statistics) may be retained
            for platform analytics purposes.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Alternative: Email Request</h2>
          <p className="text-[15px] leading-relaxed">
            If you are unable to access your account, you can request account deletion by emailing{' '}
            <a href="mailto:info@argufight.com" className="text-accent hover:underline">
              info@argufight.com
            </a>{' '}
            from the email address associated with your account. Please include your username
            in the email. We will process your request within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Questions?</h2>
          <p className="text-[15px] leading-relaxed">
            If you have questions about account deletion or data privacy, contact us at{' '}
            <a href="mailto:info@argufight.com" className="text-accent hover:underline">
              info@argufight.com
            </a>{' '}
            or visit our{' '}
            <Link href="/privacy" className="text-accent hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </section>
      </div>
    </div>
  )
}
