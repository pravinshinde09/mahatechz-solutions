import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ProsePage, Tbc } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Refund policy", robots: { index: false } };

// Draft (spec §29.1, §13.6). The eligibility window and consumption limit are business decisions.
export default function RefundPolicyPage() {
  return (
    <ProsePage title="Refund policy">
      <DraftNotice />

      <h2>Who can get a refund</h2>
      <p>
        You can ask for a refund within <Tbc>number of days</Tbc> days of purchase, provided you have completed less than <Tbc>percentage</Tbc> of
        the course. Courses granted free of charge and certificates already issued are not refundable.
      </p>

      <h2>How to ask</h2>
      <p>
        Open a support ticket from your dashboard and choose the payment. Tell us why you want a refund; it helps us improve. See{" "}
        <Link href="/contact">contact &amp; support</Link>.
      </p>

      <h2>Online payments</h2>
      <p>
        Approved refunds go back to the original payment method through Razorpay. Banks usually take 5–7 working days to show the money in your
        account.
      </p>

      <h2>Offline payments (UPI or bank transfer)</h2>
      <p>
        We transfer approved refunds to the account the payment came from, within <Tbc>number of working days</Tbc> working days. We may ask you to
        confirm the account details.
      </p>

      <h2>What happens to your access</h2>
      <p>A full refund ends your access to the course. A partial refund (for example, a pricing error) keeps your access.</p>
    </ProsePage>
  );
}
