import { ArrowRight, Award, BookOpenCheck, FileStack, Radio } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Launch categories mirror the API seed; Phase 2 renders them from GET /categories.
const categories = [
  { name: "AutoCAD Electrical", blurb: "Schematics, panel layouts, PLC I/O drawings and reports.", tag: "Electrical" },
  { name: "Revit MEP (Electrical)", blurb: "BIM workflows for lighting, power and circuiting.", tag: "BIM & MEP" },
  { name: "Electrical Design", blurb: "Load calculations, cable sizing and protection design.", tag: "Electrical" },
  { name: "PLC & SCADA", blurb: "Ladder logic, HMI screens and industrial automation basics.", tag: "Automation" },
];

const reasons = [
  { icon: BookOpenCheck, title: "Recorded lectures", body: "Study at your pace and resume exactly where you stopped — on web or Android." },
  { icon: Radio, title: "Live classes", body: "Ask questions in scheduled sessions; recordings and notes are posted afterwards." },
  { icon: FileStack, title: "Notes & practice files", body: "Daily class notes plus drawing files labelled with the software version they need." },
  { icon: Award, title: "Verifiable certificates", body: "Each certificate carries a unique number and QR code employers can check online." },
];

// Only software the launch catalogue covers (spec §1.1). Update as courses are published.
const software = ["AutoCAD Electrical", "AutoCAD", "Revit"];

const faqs = [
  {
    q: "Do I need prior experience?",
    a: "Each course lists its prerequisites. Beginner courses only assume basic computer skills and an electrical engineering background.",
  },
  {
    q: "Can I pay offline?",
    a: "Yes. Besides online payment, you can pay by UPI or bank transfer and submit the reference number; access opens once our team verifies it.",
  },
  {
    q: "Is there a mobile app?",
    a: "An Android app for learning (lectures, notes, live classes and certificates) is on the way. Purchases are made on this website.",
  },
  {
    q: "Which software version do I need?",
    a: "Every course and practice file is tagged with the software version it was recorded on, so you know what to install before you start.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-hero">
        <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr] lg:px-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs font-medium tracking-[0.02em] text-cyan">
              <span className="size-1.5 rounded-full bg-cyan" aria-hidden="true" />
              Engineering design courses for India
            </p>
            <h1 className="mt-6 text-[34px] leading-10 font-semibold md:text-5xl md:leading-[56px]">
              Learn the software electrical engineers <span className="text-primary">actually use</span> on the job.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Practical, affordable courses in AutoCAD Electrical, Revit and electrical design — recorded lectures, live classes,
              notes and certificates you can verify.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/courses">
                  Browse courses <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Create a free account</Link>
              </Button>
            </div>
          </div>
          <SchematicIllustration />
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8" aria-labelledby="categories-heading">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="categories-heading" className="text-[28px] leading-9 font-semibold">
              What you can learn
            </h2>
            <p className="mt-2 text-muted-foreground">Start with the essentials, then specialise.</p>
          </div>
          <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all courses <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <li key={c.name}>
              <Link
                href="/courses"
                className="group flex h-full flex-col rounded-md border border-border bg-surface p-5 shadow-card transition-colors duration-[120ms] hover:border-primary/40 hover:bg-surface-raised"
              >
                <span className="text-xs font-medium tracking-[0.02em] text-violet uppercase">{c.tag}</span>
                <span className="mt-3 text-xl leading-7 font-semibold group-hover:text-primary">{c.name}</span>
                <span className="mt-2 text-sm leading-[22px] text-muted-foreground">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Why learn with us */}
      <section className="border-y border-border bg-surface/40" aria-labelledby="why-heading">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20 lg:px-8">
          <h2 id="why-heading" className="text-[28px] leading-9 font-semibold">
            Built for how engineers learn
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-md border border-border bg-background/60 p-5">
                <Icon className="size-6 text-cyan" aria-hidden="true" />
                <h3 className="mt-4 text-xl leading-7 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-[22px] text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Software strip — text names only (spec §29.8) */}
      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8" aria-label="Software covered">
        <p className="text-center text-xs font-medium tracking-[0.02em] text-muted-foreground uppercase">Software covered across our courses</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2">
          {software.map((s) => (
            <li key={s} className="rounded-full border border-border px-3 py-1 font-mono text-sm text-muted-foreground">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ — native disclosure, no JavaScript needed */}
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-6" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="text-[28px] leading-9 font-semibold">
          Frequently asked questions
        </h2>
        <div className="mt-6 divide-y divide-border rounded-md border border-border bg-surface">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {f.q}
                <span className="text-muted-foreground transition-transform duration-200 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 md:px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-lg border border-border bg-hero px-6 py-12 text-center md:px-12">
          <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
          <h2 className="text-[28px] leading-9 font-semibold">Ready to start?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Create a free account to preview lessons and get notified when new batches open.</p>
          <Button asChild size="lg" className="mt-6">
            <Link href="/register">Create a free account</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

/** Decorative single-line schematic (inline SVG, no image request). */
function SchematicIllustration() {
  return (
    <div className="relative hidden rounded-lg border border-border bg-surface/70 p-6 shadow-card lg:block" aria-hidden="true">
      <div className="mb-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
        <span>SLD-01 · MAIN LV PANEL</span>
        <span className="text-cyan">REV C</span>
      </div>
      <svg viewBox="0 0 400 260" className="w-full">
        <g fill="none" stroke="var(--border-input)" strokeWidth="1.5">
          <path d="M40 40h320" stroke="var(--primary)" strokeWidth="3" />
          {[80, 160, 240, 320].map((x) => (
            <g key={x}>
              <path d={`M${x} 40v40`} />
              <rect x={x - 12} y="80" width="24" height="32" rx="3" />
              <path d={`M${x - 6} 104l12-16`} stroke="var(--accent-cyan)" />
              <path d={`M${x} 112v48`} />
              <circle cx={x} cy="178" r="18" />
              <path d={`M${x - 8} 178h16M${x} 170v16`} stroke="var(--accent-violet)" />
              <path d={`M${x} 196v24`} strokeDasharray="4 4" />
            </g>
          ))}
          <path d="M40 220h320" strokeDasharray="2 6" />
        </g>
        <g className="tabular" fontFamily="var(--font-jetbrains-mono)" fontSize="10" fill="var(--muted-foreground)">
          {["M1 · 15 kW", "M2 · 7.5 kW", "L1 · 4 kW", "SP · 2 kW"].map((label, i) => (
            <text key={label} x={80 + i * 80} y="246" textAnchor="middle">
              {label}
            </text>
          ))}
          <text x="40" y="30">415 V, 3Φ, 50 Hz</text>
        </g>
      </svg>
    </div>
  );
}
