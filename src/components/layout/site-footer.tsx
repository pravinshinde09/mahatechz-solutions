import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const columns = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "All courses" },
      { href: "/register", label: "Create an account" },
      { href: "/login", label: "Sign in" },
      { href: "/verify", label: "Verify a certificate" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact & support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/refund-policy", label: "Refund policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)] md:px-6 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">Industry-relevant engineering design skills, made affordable.</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">{col.title}</h2>
            <ul className="mt-3 grid gap-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm hover:text-primary">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        {/* Trademark disclaimer (spec §29.8). */}
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground md:px-6 lg:px-8">
          © {new Date().getFullYear()} Mahatecz Solutions. AutoCAD, AutoCAD Electrical and Revit are registered trademarks of Autodesk, Inc.
          Mahatecz Solutions is not affiliated with or endorsed by Autodesk.
        </p>
      </div>
    </footer>
  );
}
