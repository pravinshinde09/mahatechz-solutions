import type { Metadata } from "next";
import { DraftNotice, ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Cookie notice", robots: { index: false } };

// Spec §29.1. Only the two session cookies from src/lib/auth/cookies.ts exist; no analytics cookies.
export default function CookiesPage() {
  return (
    <ProsePage title="Cookie notice">
      <DraftNotice />
      <p>We use only the cookies needed to keep you signed in. We do not use advertising or analytics cookies, so there is nothing to opt out of.</p>
      <h2>Cookies we set</h2>
      <ul>
        <li>
          <strong>__Host-mz_at</strong> — keeps you signed in for up to 15 minutes at a time. Deleted when you sign out.
        </li>
        <li>
          <strong>__Secure-mz_rt</strong> — renews your sign-in without asking for your password again. Sent only to our sign-in service, and deleted when
          you sign out.
        </li>
      </ul>
      <p>
        Both cookies are marked secure and cannot be read by scripts on the page. Payments open Razorpay&apos;s checkout, which may set its own
        cookies under Razorpay&apos;s policy.
      </p>
      <p>If we add analytics in future, we will ask for your consent first and update this notice.</p>
    </ProsePage>
  );
}
