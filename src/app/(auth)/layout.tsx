import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex flex-1 flex-col bg-hero">
      <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
      <header className="mx-auto w-full max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <Logo />
      </header>
      <main id="main" className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 md:items-center md:pt-0">
        {children}
      </main>
    </div>
  );
}
