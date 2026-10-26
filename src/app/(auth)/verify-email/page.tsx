import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { InvalidLink } from "../invalid-link";
import { VerifyEmailForm } from "./verify-email-form";

export const metadata: Metadata = { title: "Verify your email", robots: { index: false }, referrer: "no-referrer" };

export default async function VerifyEmailPage(props: PageProps<"/verify-email">) {
  const { token } = await props.searchParams;
  if (typeof token !== "string" || token.length < 20) return <InvalidLink />;
  return (
    <AuthCard title="Verify your email" description="Confirm this is your email address to finish setting up your account.">
      <VerifyEmailForm token={token} />
    </AuthCard>
  );
}
