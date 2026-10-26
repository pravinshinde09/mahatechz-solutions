import { ShieldCheck, ShieldOff } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api/server";
import { getAccessToken, hasPermission, requireStaff } from "@/lib/auth/session";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "Staff" };

interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  status: string;
  roles: string[];
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
}

const dateTime = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function StaffPage() {
  const user = await requireStaff();
  if (!hasPermission(user, "staff.invite")) notFound();
  const res = await apiRequest<StaffMember[]>("/admin/staff", { accessToken: await getAccessToken() });
  const staff = res.ok ? res.data : [];

  return (
    <>
      <PageHeader title="Staff" description="Staff accounts are created by invitation only. Every staff member must enable two-factor authentication." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby="staff-heading">
          <h2 id="staff-heading" className="sr-only">
            Staff members
          </h2>
          {!res.ok ? <p className="p-6 text-danger">Couldn&apos;t load staff: {res.error.message}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    2FA
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Last sign-in
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.fullName}</p>
                      <p className="text-muted-foreground">{s.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.roles.map((r) => (
                          <Badge key={r} variant="outline" className="font-mono text-[11px]">
                            {r.replace("_", " ")}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.twoFactorEnabled ? (
                        <span className="inline-flex items-center gap-1.5 text-success">
                          <ShieldCheck className="size-4" aria-hidden="true" /> On
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-warning">
                          <ShieldOff className="size-4" aria-hidden="true" /> Not set up
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">
                      {s.lastLoginAt ? dateTime.format(new Date(s.lastLoginAt)) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="min-w-0 rounded-lg border border-border bg-surface p-6" aria-labelledby="invite-heading">
          <h2 id="invite-heading" className="font-sans text-xl leading-7 font-semibold">
            Invite a staff member
          </h2>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">They&apos;ll get an email link valid for 72 hours.</p>
          <InviteForm />
        </section>
      </div>
    </>
  );
}
