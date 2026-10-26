import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { InvalidLink } from "../invalid-link";
import { SetPasswordForm } from "../set-password-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage(props: PageProps<"/reset-password">) {
  const { token } = await props.searchParams;
  if (typeof token !== "string" || token.length < 20) return <InvalidLink retryHref="/forgot-password" retryLabel="Request a new link" />;
  return (
    <AuthCard title="Choose a new password" description="You'll be signed out of all other devices.">
      <SetPasswordForm token={token} mode="reset" />
    </AuthCard>
  );
}
