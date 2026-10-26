import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { cookieNames } from "@/lib/auth/cookies";
import { safeNext } from "@/lib/auth/safe-next";
import { TwoFactorForm } from "./two-factor-form";

export const metadata: Metadata = { title: "Two-factor verification", robots: { index: false } };

export default async function TwoFactorPage(props: PageProps<"/login/2fa">) {
  if (!(await cookies()).has(cookieNames.challenge)) redirect("/login?reason=expired");
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? safeNext(params.next, "") || undefined : undefined;
  return (
    <AuthCard
      title="Two-factor verification"
      description="Enter the code from your authenticator app to finish signing in."
      footer={
        <Link href="/login" className="text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <TwoFactorForm next={next} />
    </AuthCard>
  );
}
