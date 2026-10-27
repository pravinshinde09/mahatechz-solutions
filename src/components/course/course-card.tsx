import { Clock, PlayCircle } from "lucide-react";
import Link from "next/link";
import type { CourseCard as CourseCardData } from "@/lib/contracts/catalog";
import { formatDuration, levelLabel } from "@/lib/format";
import { Price } from "./price";

/** Spec §21.6 CourseCard: 16:9 thumbnail, category chip, 2-line title, meta in mono, price. */
export function CourseCard({ course, priority = false }: { course: CourseCardData; priority?: boolean }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-md border border-border bg-surface shadow-card transition-colors duration-[120ms] hover:border-primary/40 hover:bg-surface-raised"
    >
      <div className="relative aspect-video bg-surface-raised">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Cloudinary already serves sized, optimised variants
          <img
            src={course.thumbnailUrl}
            alt=""
            width={640}
            height={360}
            loading={priority ? "eager" : "lazy"}
            className="size-full object-cover"
          />
        ) : (
          <div className="grid-backdrop size-full" aria-hidden="true" />
        )}
        <span className="absolute top-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-xs font-medium tracking-[0.02em] text-violet backdrop-blur">
          {course.category.name}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-lg leading-6 font-semibold group-hover:text-primary">{course.title}</h3>
        {course.instructors.length ? <p className="mt-1 truncate text-sm text-muted-foreground">{course.instructors.join(", ")}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground tabular">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {formatDuration(course.durationMinutes * 60)}
          </span>
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="size-3.5" aria-hidden="true" />
            {course.lessonCount} lessons
          </span>
          <span>{levelLabel[course.level]}</span>
        </div>
        <div className="mt-auto pt-4">
          <Price price={course.price} />
        </div>
      </div>
    </Link>
  );
}
