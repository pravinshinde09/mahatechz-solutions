import type { Metadata } from "next";
import { DraftNotice, ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Terms of use", robots: { index: false } };

// Placeholder outline until legal review (spec §29.1); required before Razorpay activation.
export default function TermsPage() {
  return (
    <ProsePage title="Terms of use">
      <DraftNotice />
      <p>This page will cover:</p>
      <ul>
        <li>Accounts and eligibility</li>
        <li>Course access and licence</li>
        <li>Payments, pricing and taxes</li>
        <li>Acceptable use</li>
        <li>Intellectual property</li>
        <li>Limitation of liability</li>
        <li>Governing law and contact</li>
      </ul>
    </ProsePage>
  );
}
