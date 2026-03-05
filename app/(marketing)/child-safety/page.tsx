import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Child Safety Standards | ArguFight',
  description: 'Child safety standards and CSAE prevention policy for ArguFight.',
}

export default function ChildSafetyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <p className="text-[13px] font-[500] text-accent uppercase tracking-widest mb-4">Safety</p>
        <h1 className="text-[40px] font-[700] tracking-[-1.5px] text-text mb-3">
          Child Safety Standards
        </h1>
        <p className="text-[14px] text-text-3">Last updated: March 2026</p>
      </div>

      <div className="h-px bg-border mb-10" />

      <div className="prose prose-sm max-w-none text-text-2 space-y-8">

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Our Commitment</h2>
          <p className="text-[15px] leading-relaxed">
            ArguFight is committed to the safety and well-being of all users, especially minors.
            We maintain a zero-tolerance policy toward child sexual abuse and exploitation (CSAE)
            on our platform. We actively work to prevent, detect, and respond to any content or
            behavior that endangers children.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Age Requirements</h2>
          <p className="text-[15px] leading-relaxed">
            ArguFight is designed exclusively for adults aged 18 and older. Users must confirm
            they meet this age requirement during account registration. We do not knowingly allow
            minors to create accounts or participate in debates on the platform. Accounts found to
            belong to users under 18 will be immediately suspended and removed.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Prohibited Content and Conduct</h2>
          <p className="text-[15px] leading-relaxed mb-3">
            The following is strictly prohibited on ArguFight:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-text-3 ml-2">
            <li>Child sexual abuse material (CSAM) of any kind</li>
            <li>Content that sexualizes, exploits, or endangers minors</li>
            <li>Grooming behavior or any attempts to solicit minors</li>
            <li>Sharing or distributing exploitative imagery or links</li>
            <li>Any content that promotes or glorifies harm to children</li>
          </ul>
          <p className="text-[15px] leading-relaxed mt-3">
            Violations result in immediate account termination, content removal, and reporting
            to the appropriate authorities.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Reporting Mechanisms</h2>
          <p className="text-[15px] leading-relaxed mb-3">
            ArguFight provides multiple ways for users to report child safety concerns:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-text-3 ml-2">
            <li>
              <strong className="text-text">In-app reporting:</strong> Users can report content or
              users directly through the report function available on all profiles and debate content
            </li>
            <li>
              <strong className="text-text">Email:</strong> Reports can be sent to{' '}
              <a href="mailto:safety@argufight.com" className="text-accent hover:underline">
                safety@argufight.com
              </a>
            </li>
            <li>
              <strong className="text-text">Contact form:</strong> Available at{' '}
              <a href="mailto:info@argufight.com" className="text-accent hover:underline">
                info@argufight.com
              </a>
            </li>
          </ul>
          <p className="text-[15px] leading-relaxed mt-3">
            All reports related to child safety are treated as high priority and are reviewed promptly.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Content Moderation</h2>
          <p className="text-[15px] leading-relaxed">
            We employ a combination of automated systems and human moderation to monitor content
            on our platform. Debate content is reviewed by AI systems that flag potentially harmful
            material. Flagged content is escalated for human review. Our moderation team is trained
            to identify and respond to CSAE-related content and takes immediate action upon detection.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Cooperation with Authorities</h2>
          <p className="text-[15px] leading-relaxed">
            ArguFight complies with all applicable child safety laws and regulations. When we identify
            or receive reports of CSAM or child exploitation, we:
          </p>
          <ul className="list-disc list-inside space-y-2 text-[15px] leading-relaxed text-text-3 ml-2 mt-3">
            <li>Immediately remove the content and disable the offending account</li>
            <li>Report incidents to the National Center for Missing &amp; Exploited Children (NCMEC) via the CyberTipline</li>
            <li>Cooperate with law enforcement agencies and regional authorities as required</li>
            <li>Preserve relevant evidence in accordance with legal requirements</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">User Blocking</h2>
          <p className="text-[15px] leading-relaxed">
            Users have the ability to block other users on the platform. Blocked users are prevented
            from initiating debates, sending messages, or interacting with the blocking user. This
            feature empowers our community to proactively manage their own safety.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Staff Training and Accountability</h2>
          <p className="text-[15px] leading-relaxed">
            All team members involved in content moderation and user safety are trained on child safety
            policies, identification of CSAE material, and proper reporting procedures. We regularly
            review and update our policies to align with evolving best practices and legal requirements.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Policy Updates</h2>
          <p className="text-[15px] leading-relaxed">
            We regularly review and update these child safety standards to reflect changes in laws,
            technology, and best practices. Significant updates will be communicated to users through
            the platform.
          </p>
        </section>

        <section>
          <h2 className="text-[20px] font-[600] text-text mb-3">Contact</h2>
          <p className="text-[15px] leading-relaxed">
            For questions about our child safety standards or to report a concern, contact our
            designated safety team at{' '}
            <a href="mailto:safety@argufight.com" className="text-accent hover:underline">
              safety@argufight.com
            </a>{' '}
            or{' '}
            <a href="mailto:info@argufight.com" className="text-accent hover:underline">
              info@argufight.com
            </a>.
          </p>
        </section>

      </div>
    </div>
  )
}
