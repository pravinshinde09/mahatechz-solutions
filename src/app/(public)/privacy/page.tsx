import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ProsePage, Tbc } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Privacy policy", robots: { index: false } };

// Draft from how the platform actually handles data (spec §29.1, §29.2, §29.5). Pending legal review.
export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy">
      <DraftNotice />
      <p>
        This policy explains what personal data Mahatecz Solutions (&ldquo;we&rdquo;) collects when you use our website and Android app, why we
        collect it, who we share it with, how long we keep it and the rights you have under India&apos;s Digital Personal Data Protection Act,
        2023.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, optional phone number, password (stored only as a one-way hash) and, for staff,
          two-factor authentication settings.
        </li>
        <li>
          <strong>Learning activity:</strong> enrolments, lessons opened and completed, video watch time, quiz answers and scores, and certificates
          issued to you.
        </li>
        <li>
          <strong>Payments:</strong> order amounts, status and payment references from Razorpay. Card, UPI and bank details are entered on
          Razorpay&apos;s checkout and never reach our servers. For offline payments we keep the transaction reference and the proof image you upload.
        </li>
        <li>
          <strong>Support:</strong> messages and attachments you send in support tickets.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, device and browser type, and security logs (sign-ins, password changes) used to protect your
          account and prevent abuse.
        </li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li>To create your account, give you access to the courses you enrol in and track your progress.</li>
        <li>To process payments and refunds and to keep the accounting records the law requires.</li>
        <li>To issue certificates and let others verify them.</li>
        <li>To send you account emails (verification, password reset, receipts, class reminders). Marketing emails only with your consent.</li>
        <li>To keep the platform secure, investigate errors and answer support requests.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>We do not sell your data. We use these service providers, who process data on our behalf:</p>
      <ul>
        <li>Razorpay — online payments</li>
        <li>Neon — database hosting</li>
        <li>Railway — application hosting</li>
        <li>Cloudflare — website delivery, security and file storage (including encrypted backups)</li>
        <li>Bunny.net and Cloudinary — video and image delivery</li>
        <li>Resend — email delivery</li>
        <li>Sentry — error reports, with request details and user identities removed</li>
        <li>Google Meet — live classes you choose to join</li>
      </ul>
      <p>
        Some of these providers store or process data outside India. <Tbc>cross-border transfer disclosure and provider regions</Tbc>
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your account: until you delete it. After a 14-day grace period your profile is anonymised.</li>
        <li>Payment and order records: as long as tax and accounting law requires, with minimal identifiers after account deletion.</li>
        <li>Offline payment proof images: one year after the payment is approved or rejected.</li>
        <li>Certificates: indefinitely, so they can still be verified, unless revoked.</li>
        <li>Detailed video watch records: 90 days (totals are kept with your progress).</li>
        <li>Support tickets: two years after closure.</li>
        <li>Security and audit logs: at least three years.</li>
        <li>
          Backups: 30 daily and 12 monthly encrypted copies. Data you delete stays in backups until they expire.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We only use cookies needed to keep you signed in. See the <Link href="/cookies">cookie notice</Link>.
      </p>

      <h2>Your rights</h2>
      <p>
        You can see and correct your profile in your account settings and delete your account from there. You can also ask us for a summary of the
        data we hold about you, withdraw consent for marketing emails, or raise a complaint. If you are not satisfied with our answer, you may
        complain to the Data Protection Board of India.
      </p>

      <h2>Children</h2>
      <p>
        <Tbc>minimum age and parental consent for students under 18 (spec Q-14)</Tbc>
      </p>

      <h2>Grievance officer</h2>
      <p>
        <Tbc>name, email and postal address of the grievance officer; response time</Tbc>
      </p>
    </ProsePage>
  );
}
