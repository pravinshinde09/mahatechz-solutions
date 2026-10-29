import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Certificate policy", robots: { index: false } };

// Draft (spec §16, §29.1, §29.6). Pending legal review.
export default function CertificatePolicyPage() {
  return (
    <ProsePage title="Certificate policy">
      <DraftNotice />

      <h2>Who gets a certificate</h2>
      <p>
        A course&apos;s completion rules (lessons completed, quiz scores and, for some courses, attendance) are shown on the course page. When you
        meet them, your certificate is issued automatically or after a staff review. Staff can issue a certificate as an exception only with a
        recorded reason.
      </p>

      <h2>What a certificate means</h2>
      <p>
        A Mahatecz Solutions certificate confirms that you completed one of our courses. It is not a university qualification and not an official
        software-vendor certification. In particular, it is not an Autodesk certification.
      </p>

      <h2>Verification</h2>
      <p>
        Every certificate has a unique code and QR code. Anyone with the code can check it on the <Link href="/verify">verification page</Link>,
        which shows only your name as printed, the course, the issue date and whether the certificate is valid. Verification pages are hidden from
        search engines.
      </p>

      <h2>Name corrections</h2>
      <p>
        If your name is printed incorrectly, open a support ticket. We will reissue the certificate with the corrected name; the old code then shows
        as replaced.
      </p>

      <h2>Revocation</h2>
      <p>
        We may revoke a certificate if it was issued in error or if it was obtained through cheating or
        account sharing. A revoked certificate shows as revoked when verified.
      </p>
    </ProsePage>
  );
}
