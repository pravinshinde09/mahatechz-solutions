import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { apiPage } from "@/lib/api/server";
import { hasPermission, requireStaff } from "@/lib/auth/session";
import type { MediaAsset } from "@/lib/contracts/media";
import { formatDateTime, formatDuration } from "@/lib/format";
import { DeleteMediaButton } from "./delete-media-button";

export const metadata: Metadata = { title: "Media library" };

const purposes = [
  ["", "All files"],
  ["THUMBNAIL", "Thumbnails"],
  ["LECTURE_VIDEO", "Lecture videos"],
  ["DOCUMENT", "Documents"],
  ["PRACTICE_FILE", "Practice files"],
] as const;

const size = (b: number | null) => (b === null ? "—" : b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : b >= 1024 ** 2 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export default async function MediaLibraryPage(props: PageProps<"/admin/media">) {
  const user = await requireStaff();
  if (!hasPermission(user, "media.upload")) notFound();
  const params = await props.searchParams;
  const purpose = typeof params.purpose === "string" ? params.purpose : "";
  const status = typeof params.status === "string" && /^[A-Z_]+$/.test(params.status) ? params.status : "";
  const q = typeof params.q === "string" ? params.q : "";
  const result = await apiPage<MediaAsset, { total: number }>(`/admin/media?${new URLSearchParams({ pageSize: "50", ...(purpose ? { purpose } : {}), ...(status ? { status } : {}), ...(q ? { q } : {}) })}`, { authed: true });
  const rows = result?.data ?? [];

  return (
    <>
      <PageHeader title="Media library" description="Every uploaded file. Files are uploaded from the course editor; a file in use can't be deleted." />
      <form method="get" className="mb-4 flex flex-wrap gap-3" role="search">
        <input name="q" defaultValue={q} placeholder="Search by name" aria-label="Search by name" className="h-10 min-w-56 flex-1 rounded-sm border border-input bg-surface px-3" />
        <select name="purpose" defaultValue={purpose} aria-label="File type" className="h-10 rounded-sm border border-input bg-surface px-3">
          {purposes.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-md border border-border px-4 text-sm hover:bg-surface-raised">
          Filter
        </button>
      </form>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-xs tracking-[0.02em] text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                File
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Type
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Size
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Uploaded
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-3">
                    {a.publicUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- CDN thumbnail
                      <img src={a.publicUrl} alt="" width={64} height={36} className="aspect-video w-16 rounded-sm object-cover" />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{a.title ?? a.originalFilename}</span>
                      <span className="block truncate text-xs text-muted-foreground">{a.originalFilename}</span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {a.purpose.replace("_", " ").toLowerCase()}
                  {a.durationSeconds ? ` · ${formatDuration(a.durationSeconds)}` : ""}
                </td>
                <td className="px-4 py-3 text-xs">
                  <span className={a.status === "READY" ? "text-success" : ["FAILED", "REJECTED"].includes(a.status) ? "text-danger" : "text-warning"}>{a.status.toLowerCase().replace("_", " ")}</span>
                  {a.providerError ? <span className="block text-muted-foreground">{a.providerError}</span> : null}
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular">{size(a.sizeBytes)}</td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-muted-foreground">{formatDateTime(a.createdAt)}</td>
                <td className="px-4 py-3 text-right">{hasPermission(user, "media.delete") ? <DeleteMediaButton id={a.id} name={a.title ?? a.originalFilename ?? "file"} /> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-muted-foreground">
            No files yet. Upload thumbnails, videos and notes from a <Link href="/admin/courses" className="text-primary underline">course</Link>.
          </p>
        ) : null}
      </div>
    </>
  );
}
