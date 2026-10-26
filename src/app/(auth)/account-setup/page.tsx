import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { InvalidLink } from "../invalid-link";
import { SetPasswordForm } from "../set-password-form";

export const metadata: Metadata = { title: "Set up your account", robots: { index: false }, referrer: "no-referrer" };

// Landing page for the one-time super-admin bootstrap link (spec §9.4).
export default async function AccountSetupPage(props: PageProps<"/account-setup">) {
  const { token } = await props.searchParams;
  if (typeof token !== "string" || token.length < 20) return <InvalidLink />;
  return (
    <AuthCard
      title="Set up your administrator account"
      description="Choose a password. After signing in you'll be asked to enable two-factor authentication."
    >
      <SetPasswordForm token={token} mode="reset" />
    </AuthCard>
  );
}
