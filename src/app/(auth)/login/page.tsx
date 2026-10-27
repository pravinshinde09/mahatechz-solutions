import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/forms/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getCurrentUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/auth/safe-next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const notices = {
  "signed-out": { variant: "info", icon: Info, text: "You have been signed out." },
  expired: { variant: "info", icon: Info, text: "Your session ended. Please sign in again." },
  suspended: { variant: "destructive", icon: CircleAlert, text: "Your account is suspended. Please contact support." },
  "password-set": { variant: "success", icon: CircleCheck, text: "Your password has been set. Sign in to continue." },
  "deletion-requested": { variant: "info", icon: Info, text: "Your account will be deleted in 14 days. Sign in before then if you change your mind." },
  "invitation-accepted": { variant: "success", icon: CircleCheck, text: "Your staff account is ready. Sign in, then enable two-factor authentication." },
} as const;

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const next = typeof params.next === "string" ? safeNext(params.next, "") || undefined : undefined;
  const reason = typeof params.reason === "string" && params.reason in notices ? notices[params.reason as keyof typeof notices] : null;

  const { user } = await getCurrentUser();
  if (user) redirect(next ?? (user.isStaff ? "/admin" : "/app"));

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back. Continue where you left off."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {reason ? (
        <Alert variant={reason.variant} className="mb-5">
          <reason.icon />
          <AlertDescription>{reason.text}</AlertDescription>
        </Alert>
      ) : null}
      <LoginForm next={next} />
    </AuthCard>
  );
}
