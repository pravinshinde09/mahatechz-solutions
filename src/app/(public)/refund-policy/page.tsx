import type { Metadata } from "next";
import { DraftNotice, ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Refund policy", robots: { index: false } };

// Placeholder outline until legal review (spec §29.1); required before Razorpay activation.
export default function RefundPolicyPage() {
  return (
    <ProsePage title="Refund policy">
      <DraftNotice />
      <p>This page will cover:</p>
      <ul>
        <li>Eligibility window</li>
        <li>How much of the course may be consumed</li>
        <li>Online payments</li>
        <li>Offline (UPI / bank transfer) payments</li>
        <li>How refunds are processed and how long they take</li>
      </ul>
    </ProsePage>
  );
}
