import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { InvalidLink } from "../invalid-link";
import { SetPasswordForm } from "../set-password-form";

export const metadata: Metadata = { title: "Accept your invitation", robots: { index: false }, referrer: "no-referrer" };

export default async function AcceptInvitationPage(props: PageProps<"/accept-invitation">) {
  const { token } = await props.searchParams;
  if (typeof token !== "string" || token.length < 20) return <InvalidLink />;
  return (
    <AuthCard
      title="Join the Mahatecz team"
      description="Set your password to activate your staff account. Two-factor authentication is required for all staff."
    >
      <SetPasswordForm token={token} mode="invitation" />
    </AuthCard>
  );
}
