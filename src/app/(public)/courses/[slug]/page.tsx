import { Award, Check, ChevronDown, Clock, FileText, Globe2, Lock, PlayCircle, Signal } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Price } from "@/components/course/price";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth/session";
import type { CourseDetail } from "@/lib/contracts/catalog";
import { formatDate, formatDuration, languageLabel, levelLabel } from "@/lib/format";

const loadCourse = cache(async (slug: string) => {
  const res = await apiRequest<CourseDetail>(`/courses/${encodeURIComponent(slug)}`, { accessToken: await getAccessToken() });
  return res.ok ? res.data : null;
});

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const course = await loadCourse((await props.params).slug);
  if (!course) return { title: "Course not found" };
  return {
    title: course.title,
    description: course.subtitle ?? undefined,
    alternates: { canonical: `/courses/${course.slug}` },
    openGraph: { title: course.title, description: course.subtitle ?? undefined, ...(course.heroImageUrl ? { images: [course.heroImageUrl] } : {}) },
  };
}

const lessonIcon = { VIDEO: PlayCircle, EXTERNAL_VIDEO: PlayCircle, ARTICLE: FileText, RESOURCE: FileText } as Record<string, typeof PlayCircle>;

export default async function CourseDetailPage(props: PageProps<"/courses/[slug]">) {
  const course = await loadCourse((await props.params).slug);
  if (!course) notFound();
  const { user } = await getCurrentUser();
  const lessonCount = course.syllabus.reduce((n, m) => n + m.lessons.length, 0);

  // Structured data for search engines (spec FR-CAT-06). "<" is escaped so it can't close the tag.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.subtitle ?? course.title,
    provider: { "@type": "Organization", name: "Mahatecz Solutions" },
    inLanguage: course.language,
    ...(course.heroImageUrl ? { image: course.heroImageUrl } : {}),
    offers: { "@type": "Offer", category: course.price.isFree ? "Free" : "Paid", price: (course.price.effectivePaise / 100).toFixed(2), priceCurrency: course.price.currency },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: `PT${Math.max(1, Math.round(course.durationMinutes / 60))}H` },
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <section className="relative isolate overflow-hidden border-b border-border bg-hero">
        <div className="grid-backdrop pointer-events-none absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 lg:grid-cols-[1fr_380px] lg:px-8 lg:py-16">
          <div>
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground">
                Courses
              </Link>{" "}
              /{" "}
              <Link href={`/courses?category=${course.category.slug}`} className="hover:text-foreground">
                {course.category.name}
              </Link>
            </nav>
            <h1 className="mt-4 text-[28px] leading-[34px] font-semibold md:text-4xl md:leading-[44px]">{course.title}</h1>
            {course.subtitle ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{course.subtitle}</p> : null}
            {course.instructors.length ? <p className="mt-4 text-sm">Taught by {course.instructors.join(", ")}</p> : null}
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm text-muted-foreground tabular">
              <Meta icon={Clock}>{formatDuration(course.durationMinutes * 60)}</Meta>
              <Meta icon={PlayCircle}>{lessonCount} lessons</Meta>
              <Meta icon={Signal}>{levelLabel[course.level]}</Meta>
              <Meta icon={Globe2}>{languageLabel(course.language)}</Meta>
              {course.certificateEnabled ? <Meta icon={Award}>Certificate</Meta> : null}
            </ul>
            {course.softwareTags.length ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {course.softwareTags.map((t) => (
                  <li key={t} className="rounded-full border border-border bg-surface/70 px-3 py-1 font-mono text-xs">
                    {t}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Price box: sticky on desktop (spec §22.1) */}
          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Enrolment">
            <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
              {course.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- CDN-sized image
                <img src={course.heroImageUrl} alt="" width={1280} height={720} className="aspect-video w-full object-cover" />
              ) : null}
              <div className="grid gap-4 p-6">
                <Price price={course.price} size="lg" />
                {course.viewer.isEnrolled ? (
                  <Button size="lg" className="w-full" asChild>
                    <Link href="/app/courses">Go to course</Link>
                  </Button>
                ) : (
                  <>
                    {/* Checkout (Razorpay and offline payment) arrives in Phase 3. */}
                    <Button size="lg" className="w-full" disabled aria-disabled="true">
                      Enrolment opens soon
                    </Button>
                    {!user ? (
                      <p className="text-center text-sm text-muted-foreground">
                        <Link href={`/register`} className="text-primary hover:underline">
                          Create a free account
                        </Link>{" "}
                        to be notified.
                      </p>
                    ) : null}
                  </>
                )}
                <ul className="grid gap-2 text-sm text-muted-foreground">
                  <li>{course.accessDurationDays ? `${course.accessDurationDays} days of access` : "Lifetime access"}</li>
                  <li>Watch on web and Android</li>
                  {course.certificateEnabled ? <li>Verifiable certificate on completion</li> : null}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 md:px-6 lg:grid-cols-[1fr_380px] lg:px-8">
        <div className="grid min-w-0 gap-12">
          {course.learningObjectives.length ? (
            <section aria-labelledby="learn-heading" className="rounded-lg border border-border bg-surface p-6">
              <h2 id="learn-heading" className="text-2xl font-semibold">
                What you&apos;ll learn
              </h2>
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {course.learningObjectives.map((o) => (
                  <li key={o} className="flex gap-3">
                    <Check className="mt-1 size-4 shrink-0 text-success" aria-hidden="true" />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="syllabus-heading">
            <h2 id="syllabus-heading" className="text-2xl font-semibold">
              Course content
            </h2>
            <p className="mt-1 font-mono text-sm text-muted-foreground tabular">
              {course.syllabus.length} modules · {lessonCount} lessons · {formatDuration(course.durationMinutes * 60)}
            </p>
            <div className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
              {course.syllabus.map((m, i) => (
                <details key={m.id} className="group" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 hover:bg-surface-raised">
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
                    <span className="flex-1 font-medium">{m.title}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular">
                      {m.lessons.length} · {formatDuration(m.durationSeconds)}
                    </span>
                  </summary>
                  <ul className="border-t border-border bg-background/40">
                    {m.lessons.map((l) => {
                      const Icon = lessonIcon[l.type] ?? FileText;
                      return (
                        <li key={l.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                          <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          {l.isPreview ? (
                            <Link href={`/courses/${course.slug}/preview/${l.id}`} className="flex-1 text-primary hover:underline">
                              {l.title}
                              <span className="ml-2 rounded-full border border-cyan/40 px-2 py-0.5 text-xs text-cyan">Preview</span>
                            </Link>
                          ) : (
                            <span className="flex flex-1 items-center gap-2">
                              {l.title}
                              <Lock className="size-3 text-muted-foreground" aria-label="Enrolled students only" />
                            </span>
                          )}
                          <span className="font-mono text-xs text-muted-foreground tabular">{formatDuration(l.durationSeconds)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          {course.descriptionHtml ? (
            <section aria-labelledby="about-heading">
              <h2 id="about-heading" className="text-2xl font-semibold">
                About this course
              </h2>
              {/* Rendered from Markdown and sanitised with an allowlist by the API (src/lib/markdown.ts there). */}
              <div className="prose-content mt-4" dangerouslySetInnerHTML={{ __html: course.descriptionHtml }} />
            </section>
          ) : null}

          {course.prerequisites.length || course.targetAudience.length ? (
            <section className="grid gap-8 md:grid-cols-2">
              <List title="Prerequisites" items={course.prerequisites} />
              <List title="Who this course is for" items={course.targetAudience} />
            </section>
          ) : null}

          {course.instructorProfiles.length ? (
            <section aria-labelledby="instructors-heading">
              <h2 id="instructors-heading" className="text-2xl font-semibold">
                {course.instructorProfiles.length > 1 ? "Instructors" : "Instructor"}
              </h2>
              <ul className="mt-4 grid gap-4">
                {course.instructorProfiles.map((p) => (
                  <li key={p.name} className="rounded-lg border border-border bg-surface p-5">
                    <p className="font-semibold">{p.name}</p>
                    {p.headline ? <p className="text-sm text-muted-foreground">{p.headline}</p> : null}
                    {p.bio ? <p className="mt-3 text-sm leading-6 whitespace-pre-line">{p.bio}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {course.faq.length ? (
            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="text-2xl font-semibold">
                Frequently asked questions
              </h2>
              <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
                {course.faq.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
                    <p className="mt-3 text-muted-foreground whitespace-pre-line">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <p className="text-xs text-muted-foreground">Last updated {formatDate(course.updatedAt)}</p>
        </div>
      </div>
    </>
  );
}

function Meta({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </li>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return <div />;
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <ul className="mt-3 grid gap-2">
        {items.map((i) => (
          <li key={i} className="flex gap-2 text-muted-foreground">
            <span aria-hidden="true">•</span>
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
