import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authedRequest } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import { OfflineSettingsForm, type OfflineSettings } from "./offline-settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "settings.manage")) notFound();
  const res = await authedRequest<OfflineSettings>("/admin/settings/offline-payments");
  return (
    <>
      <PageHeader title="Settings" />
      <section className="max-w-2xl rounded-lg border border-border bg-surface p-6 md:p-8" aria-labelledby="offline-heading">
        <h2 id="offline-heading" className="font-sans text-xl font-semibold">
          Offline payment details
        </h2>
        <p className="mt-1 mb-4 text-sm text-muted-foreground">Shown to students who choose UPI or bank transfer.</p>
        <Alert variant="warning" className="mb-6">
          <ShieldAlert />
          <AlertDescription>
            Double-check every character — students send money to exactly these details. Ask a second person to verify them, and review the audit log after any change.
          </AlertDescription>
        </Alert>
        {res.ok ? <OfflineSettingsForm initial={res.data} /> : <p className="text-danger">{res.error.message}</p>}
      </section>
    </>
  );
}
