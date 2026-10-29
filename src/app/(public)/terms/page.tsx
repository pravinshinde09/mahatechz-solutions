import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ProsePage, Tbc } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Terms of use", robots: { index: false } };

// Draft covering the topics in spec §29.1. Pending legal review.
export default function TermsPage() {
  return (
    <ProsePage title="Terms of use">
      <DraftNotice />
      <p>These terms apply when you use the Mahatecz Solutions website and Android app. By creating an account you agree to them.</p>

      <h2>Your account</h2>
      <ul>
        <li>
          You must give accurate details and be at least <Tbc>minimum age</Tbc> years old, or have a parent&apos;s or guardian&apos;s consent.
        </li>
        <li>An account is for one person. Sharing your sign-in or course access with others is not allowed.</li>
        <li>You are responsible for keeping your password safe. Tell us straight away if you think someone else has used your account.</li>
      </ul>

      <h2>Courses and access</h2>
      <p>
        Buying or being granted a course gives you a personal, non-transferable licence to view it for the access period shown on the course page.
        See the <Link href="/course-access-policy">course access policy</Link>.
      </p>

      <h2>Payments</h2>
      <p>
        Prices are shown in Indian rupees. Online payments are processed by Razorpay; offline payments are activated after we verify them. Refunds
        follow the <Link href="/refund-policy">refund policy</Link>. <Tbc>GST treatment and invoices (spec Q-10)</Tbc>
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not download, record, copy, resell or redistribute course videos, notes or files.</li>
        <li>Do not try to get around access controls, attack the platform or use automated tools to scrape it.</li>
        <li>Be respectful in live classes and support messages.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules. Suspension ends all active sessions.</p>

      <h2>Intellectual property</h2>
      <p>
        Course content belongs to Mahatecz Solutions or its instructors and licensors. AutoCAD, AutoCAD Electrical and Revit are trademarks of
        Autodesk, Inc.; we are not affiliated with or endorsed by Autodesk, and our certificates are not Autodesk certifications. See the{" "}
        <Link href="/certificate-policy">certificate policy</Link>.
      </p>

      <h2>Liability</h2>
      <p>
        Our courses teach skills; they do not guarantee employment or exam results. <Tbc>limitation of liability wording</Tbc>
      </p>

      <h2>Changes and contact</h2>
      <p>
        We will tell you by email before material changes to these terms take effect. Questions: see <Link href="/contact">contact &amp; support</Link>.
      </p>
      <p>
        <Tbc>governing law and courts with jurisdiction</Tbc>
      </p>
    </ProsePage>
  );
}
