import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { ChangePasswordForm, ProfileForm } from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="grid gap-6 border-b border-border py-8 first:pt-0 last:border-0 md:grid-cols-[240px_1fr] md:gap-10">
      <div>
        <h2 className="font-sans text-xl leading-7 font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="max-w-lg">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="Settings" />
      <div className="rounded-lg border border-border bg-surface p-6 md:p-8">
        <Section title="Profile" description="Your name appears on certificates exactly as entered here.">
          <ProfileForm fullName={user.fullName} phone={user.phone} email={user.email} />
        </Section>
        <Section title="Password" description="Changing it signs you out on every other device.">
          <ChangePasswordForm email={user.email} />
        </Section>
        <Section title="Devices" description="Lost a phone or used a shared computer?">
          <form action="/api/auth/logout?all=1" method="post">
            <Button type="submit" variant="outline" size="lg">
              Sign out of all devices
            </Button>
          </form>
        </Section>
      </div>
    </>
  );
}
