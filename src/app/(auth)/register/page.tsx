import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Preview lessons for free. Verify your email to enrol."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
