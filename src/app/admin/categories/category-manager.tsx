"use client";

import { Eye, EyeOff, Trash2, X } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SelectField } from "@/components/forms/select-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import { idle, type FormState } from "@/lib/forms";
import { createCategoryAction, createTagAction, deleteCategoryAction, deleteTagAction, setCategoryActiveAction } from "./actions";

type Category = { id: string; name: string; slug: string; isActive: boolean; courseCount: number };
export type CategoryNode = Category & { children: Category[] };
export type Tag = { id: string; type: "SOFTWARE" | "SKILL" | "TOPIC"; name: string; slug: string };

export function CategoryManager({ categories, tags }: { categories: CategoryNode[]; tags: Tag[] }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<FormState>(idle);
  const run = (fn: () => Promise<FormState>) => startTransition(async () => setNotice(await fn()));
  const [catState, createCategory] = useActionState(createCategoryAction, idle);
  const [tagState, createTag] = useActionState(createTagAction, idle);

  const row = (c: Category, child = false) => (
    <li key={c.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 text-sm ${child ? "pl-10" : ""}`}>
      <span className={`flex-1 ${child ? "" : "font-semibold"} ${c.isActive ? "" : "text-muted-foreground line-through"}`}>{c.name}</span>
      <span className="font-mono text-xs text-muted-foreground">{c.slug}</span>
      <span className="w-20 text-right font-mono text-xs text-muted-foreground tabular">{c.courseCount} courses</span>
      <Button type="button" variant="ghost" size="icon-sm" disabled={pending} aria-label={c.isActive ? `Hide ${c.name}` : `Show ${c.name}`} onClick={() => run(() => setCategoryActiveAction(c.id, !c.isActive))}>
        {c.isActive ? <EyeOff /> : <Eye />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={`Delete ${c.name}`}
        onClick={() => {
          if (window.confirm(`Delete “${c.name}”?`)) run(() => deleteCategoryAction(c.id));
        }}
      >
        <Trash2 />
      </Button>
    </li>
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="grid min-w-0 gap-6">
        <FormMessage state={notice} />
        <section className="overflow-hidden rounded-lg border border-border bg-surface" aria-label="Categories">
          {categories.length ? (
            <ul className="divide-y divide-border">
              {categories.map((c) => (
                <li key={c.id}>
                  <ul className="divide-y divide-border/60">
                    {row(c)}
                    {c.children.map((child) => row(child, true))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="p-6 text-muted-foreground">No categories yet.</p>
          )}
        </section>

        <section className="rounded-lg border border-border bg-surface p-6" aria-labelledby="tags-heading">
          <h2 id="tags-heading" className="font-sans text-lg font-semibold">
            Tags
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {tags.map((t) => (
              <li key={t.id} className="inline-flex items-center gap-1 rounded-full border border-border py-1 pr-1 pl-3 text-sm">
                <span className="text-xs text-muted-foreground">{t.type.toLowerCase()}</span> {t.name}
                <button
                  type="button"
                  aria-label={`Delete tag ${t.name}`}
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(`Delete tag “${t.name}”? It is removed from all courses.`)) run(() => deleteTagAction(t.id));
                  }}
                  className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
            {tags.length === 0 ? <li className="text-sm text-muted-foreground">No tags yet — add software such as “AutoCAD Electrical 2025”.</li> : null}
          </ul>
          <form action={createTag} className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr_auto] sm:items-end">
            <SelectField name="type" label="Type" options={[{ value: "SOFTWARE", label: "Software" }, { value: "SKILL", label: "Skill" }, { value: "TOPIC", label: "Topic" }]} />
            <Field name="name" label="Tag name" required placeholder="AutoCAD Electrical 2025" error={tagState.fieldErrors?.name} />
            <SubmitButton size="default">Add tag</SubmitButton>
          </form>
          <div className="mt-3">
            <FormMessage state={tagState} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border bg-surface p-6 xl:self-start" aria-labelledby="new-category-heading">
        <h2 id="new-category-heading" className="font-sans text-lg font-semibold">
          New category
        </h2>
        <form action={createCategory} className="mt-4 grid gap-4">
          <FormMessage state={catState} />
          <Field name="name" label="Name" required maxLength={80} error={catState.fieldErrors?.name} />
          <SelectField name="parentId" label="Parent" options={[{ value: "", label: "None (top level)" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} error={catState.fieldErrors?.parentId} />
          <Field name="description" label="Description (optional)" maxLength={500} />
          <SubmitButton size="default" className="justify-self-start">
            Create category
          </SubmitButton>
        </form>
      </section>
    </div>
  );
}
