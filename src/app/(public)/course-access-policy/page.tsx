import type { Metadata } from "next";
import { DraftNotice, ProsePage, Tbc } from "@/components/layout/prose-page";

export const metadata: Metadata = { title: "Course access policy", robots: { index: false } };

// Draft (spec §29.1). Mirrors Course.accessDurationDays and enrolment expiry.
export default function CourseAccessPolicyPage() {
  return (
    <ProsePage title="Course access policy">
      <DraftNotice />

      <h2>How long you have access</h2>
      <p>
        Each course page shows its access period. Some courses give lifetime access; others give access for a fixed number of days from the date
        your enrolment starts. When a fixed period ends, the course moves to your expired courses and your progress is kept.
      </p>

      <h2>Extending access</h2>
      <p>
        <Tbc>whether expired access can be extended or re-purchased, and at what price</Tbc>
      </p>

      <h2>When a course is retired</h2>
      <p>
        If we stop offering a course, students who already enrolled keep access until their access period ends. <Tbc>minimum notice for
        lifetime-access courses</Tbc>
      </p>

      <h2>Devices</h2>
      <p>
        You can learn on the website and the Android app with the same account. Signing out, changing your password or having your account suspended
        ends your sessions on all devices.
      </p>

      <h2>Certificates</h2>
      <p>Certificates you have earned stay downloadable and verifiable after your course access ends.</p>
    </ProsePage>
  );
}
