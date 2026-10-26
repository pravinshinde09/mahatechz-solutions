import { ShieldAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireStaff } from "@/lib/auth/session";
import { TwoFactorSetup } from "./two-factor-setup";

export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await requireStaff({ allowWithout2fa: true });
  return (
    <>
      <PageHeader title="Security" description="Two-factor authentication protects the platform if your password is ever exposed." />
      {user.twoFactorEnabled ? (
        <Alert variant="success">
          <ShieldCheck />
          <AlertTitle>Two-factor authentication is on</AlertTitle>
          <AlertDescription>You&apos;ll be asked for a code from your authenticator app each time you sign in.</AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert variant="warning" className="mb-6">
            <ShieldAlert />
            <AlertTitle>Required for staff accounts</AlertTitle>
            <AlertDescription>Admin tools stay locked until two-factor authentication is set up.</AlertDescription>
          </Alert>
          <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
            <TwoFactorSetup />
          </div>
        </>
      )}
    </>
  );
}
