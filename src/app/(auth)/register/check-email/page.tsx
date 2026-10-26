import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

export default async function CheckEmailPage(props: PageProps<"/register/check-email">) {
  const { email } = await props.searchParams;
  return (
    <AuthCard title="Check your email">
      <MailCheck className="size-10 text-cyan" aria-hidden="true" />
      <p className="mt-4">
        We sent a verification link to{" "}
        {typeof email === "string" ? <strong className="break-all">{email}</strong> : "your email address"}. It expires in 24 hours.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Didn&apos;t get it? Check your spam folder. You can also sign in and request a new link from your dashboard.
      </p>
      <Button asChild size="lg" className="mt-6 w-full">
        <Link href="/login">Go to sign in</Link>
      </Button>
    </AuthCard>
  );
}
