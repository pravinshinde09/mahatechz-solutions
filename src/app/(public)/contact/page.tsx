import { Mail, MessageSquareText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Contact & support" };

// Contact details come from the organisation settings once the admin settings page exists (Phase 2+).
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
      <PageHeader title="Contact & support" description="Questions about a course, a payment or your account? We're here to help." />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-md border border-border bg-surface p-6">
          <MessageSquareText className="size-6 text-cyan" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">Already a student?</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in and open a support ticket from your dashboard so we can see your enrolments and payments.
          </p>
          <Link href="/login?next=/app" className="mt-4 inline-block font-medium text-primary hover:underline">
            Sign in to get help
          </Link>
        </section>
        <section className="rounded-md border border-border bg-surface p-6">
          <Mail className="size-6 text-cyan" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">General enquiries</h2>
          <p className="mt-2 text-muted-foreground">Email us and we&apos;ll reply within one business day.</p>
          <p className="mt-4 font-mono text-sm text-muted-foreground">Support email: to be configured</p>
        </section>
      </div>
    </div>
  );
}
