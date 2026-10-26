import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex flex-1 flex-col items-center justify-center bg-hero px-4 py-24 text-center">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <Logo />
      <p className="mt-10 font-mono text-sm text-cyan">ERROR 404 · PAGE NOT FOUND</p>
      <h1 className="mt-3 text-[28px] leading-[34px] font-semibold md:text-4xl">This drawing isn&apos;t in the set</h1>
      <p className="mt-3 max-w-md text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    </main>
  );
}
