import type { Metadata } from "next";
import { DraftNotice, ProsePage } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Privacy policy", robots: { index: false } };

// Placeholder outline until legal review (spec §29.1); required before Razorpay activation.
export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy">
      <DraftNotice />
      <p>This page will cover:</p>
      <ul>
        <li>What we collect</li>
        <li>How we use your data</li>
        <li>Who we share it with (payment, email and video providers)</li>
        <li>How long we keep it</li>
        <li>Your rights under the DPDP Act, 2023</li>
        <li>Contact our grievance officer</li>
      </ul>
    </ProsePage>
  );
}
