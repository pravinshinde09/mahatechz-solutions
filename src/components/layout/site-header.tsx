import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { MobileNav } from "./mobile-nav";

export const publicNav = [
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const { user } = await getCurrentUser();
  const home = user ? (user.isStaff ? "/admin" : "/app") : null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 md:px-6 lg:px-8">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto hidden items-center gap-2 md:flex">
          {home ? (
            <Button asChild>
              <Link href={home}>{user?.isStaff ? "Admin dashboard" : "My dashboard"}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
        <MobileNav items={publicNav} home={home} />
      </div>
    </header>
  );
}
