import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { Button } from "@/components/ui/button";

export function InvalidLink({ retryHref = "/login", retryLabel = "Go to sign in" }: { retryHref?: string; retryLabel?: string }) {
  return (
    <AuthCard title="This link isn't valid" description="It may have expired or already been used. Links in our emails work once.">
      <Button asChild size="lg" className="w-full">
        <Link href={retryHref}>{retryLabel}</Link>
      </Button>
    </AuthCard>
  );
}
