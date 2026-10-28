"use client";

import { RotateCcw } from "lucide-react";
import { useActionState, useState } from "react";
import { CertificatePreview } from "@/components/certificates/certificate-preview";
import { ActionForm } from "@/components/forms/action-form";
import { Field } from "@/components/forms/field";
import { FormMessage } from "@/components/forms/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { Uploader } from "@/components/media/uploader";
import { Button } from "@/components/ui/button";
import { defaultTemplateLayout, type CertificateTemplateView, type TemplateLayout } from "@/lib/contracts/certification";
import { idle } from "@/lib/forms";
import { saveTemplateAction } from "../../completion-actions";

type TextKey = Exclude<keyof TemplateLayout, "signature" | "qr">;
const textFields: [TextKey, string][] = [
  ["organization", "Organisation"],
  ["heading", "Heading"],
  ["recipientName", "Student name"],
  ["body", "Body text"],
  ["courseTitle", "Course title"],
  ["issueDate", "Completion date"],
  ["certificateNumber", "Certificate number"],
];

const sample = { recipientName: "Asha Patil", courseTitle: "AutoCAD Electrical Essentials", completedOn: "14 February 2027", certificateNumber: "MZT-ACE-2027-000042" };

/** Spec §22.3 "template designer": text, artwork and field positions, previewed live at true scale. */
export function TemplateDesigner({ template }: { template: CertificateTemplateView | null }) {
  const [state, action, pending] = useActionState(saveTemplateAction.bind(null, template?.id ?? null), idle);
  const v = state.values ?? {};
  const [fields, setFields] = useState({
    name: v.name ?? template?.name ?? "",
    organizationName: v.organizationName ?? template?.organizationName ?? "Mahatecz Solutions",
    heading: v.heading ?? template?.heading ?? "Certificate of Completion",
    bodyText: v.bodyText ?? template?.bodyText ?? "has successfully completed the course",
    signatoryName: v.signatoryName ?? template?.signatoryName ?? "",
    signatoryTitle: v.signatoryTitle ?? template?.signatoryTitle ?? "",
    accentColor: v.accentColor ?? template?.accentColor ?? "#1d6fe8",
  });
  const [layout, setLayout] = useState<TemplateLayout>(template?.layout ?? defaultTemplateLayout);
  const [background, setBackground] = useState<{ id: string; name: string } | null>(template?.backgroundAssetId ? { id: template.backgroundAssetId, name: "Current artwork" } : null);
  const [signature, setSignature] = useState<{ id: string; name: string } | null>(template?.signatureAssetId ? { id: template.signatureAssetId, name: "Current signature" } : null);
  const errors = state.fieldErrors ?? {};
  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [k]: e.target.value });
  const num = (value: string, fallback: number) => (Number.isFinite(Number(value)) && value !== "" ? Number(value) : fallback);

  return (
    <ActionForm action={action} pending={pending} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="grid content-start gap-5">
        <FormMessage state={state} />
        <Field name="name" label="Template name (internal)" value={fields.name} onChange={set("name")} error={errors.name} required />
        <Field name="organizationName" label="Organisation name (printed)" value={fields.organizationName} onChange={set("organizationName")} error={errors.organizationName} />
        <Field name="heading" label="Heading" value={fields.heading} onChange={set("heading")} error={errors.heading} />
        <Field name="bodyText" label="Text after the student's name" value={fields.bodyText} onChange={set("bodyText")} error={errors.bodyText} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="signatoryName" label="Signatory name" value={fields.signatoryName} onChange={set("signatoryName")} error={errors.signatoryName} />
          <Field name="signatoryTitle" label="Signatory title" value={fields.signatoryTitle} onChange={set("signatoryTitle")} error={errors.signatoryTitle} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="accent" className="text-sm font-medium">
            Accent colour
          </label>
          <div className="flex items-center gap-3">
            <input id="accent" type="color" value={fields.accentColor} onChange={set("accentColor")} className="h-11 w-14 cursor-pointer rounded-sm border border-input bg-surface" />
            <input name="accentColor" value={fields.accentColor} onChange={set("accentColor")} aria-label="Accent colour hex" className="h-11 w-32 rounded-sm border border-input bg-surface px-3 font-mono" />
          </div>
          {errors.accentColor ? <p className="text-sm text-danger">{errors.accentColor}</p> : null}
        </div>

        <fieldset className="grid gap-3 rounded-md border border-border p-4">
          <legend className="px-1 text-sm font-medium">Artwork (optional)</legend>
          <p className="text-sm text-muted-foreground">A designed background (A4 landscape PNG, JPEG or one-page PDF) replaces the built-in frame. Text and the QR code are drawn on top.</p>
          <input type="hidden" name="backgroundAssetId" value={background?.id ?? ""} />
          {background ? (
            <p className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-success">Background: {background.name}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setBackground(null)}>
                Remove
              </Button>
            </p>
          ) : (
            <Uploader purpose="CERTIFICATE_ASSET" label="Upload background" onUploaded={(a) => setBackground({ id: a.id, name: a.originalFilename ?? "artwork" })} />
          )}
          {errors.backgroundAssetId ? <p className="text-sm text-danger">{errors.backgroundAssetId}</p> : null}
          <input type="hidden" name="signatureAssetId" value={signature?.id ?? ""} />
          {signature ? (
            <p className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-success">Signature: {signature.name}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setSignature(null)}>
                Remove
              </Button>
            </p>
          ) : (
            <Uploader purpose="CERTIFICATE_ASSET" label="Upload signature (PNG with transparent background)" onUploaded={(a) => setSignature({ id: a.id, name: a.originalFilename ?? "signature" })} />
          )}
          {errors.signatureAssetId ? <p className="text-sm text-danger">{errors.signatureAssetId}</p> : null}
        </fieldset>

        <details className="rounded-md border border-border p-4">
          <summary className="cursor-pointer text-sm font-medium">Field positions (points on A4 landscape, 842 × 595, from the bottom-left)</summary>
          <input type="hidden" name="layout" value={JSON.stringify(layout)} />
          <div className="mt-4 grid gap-3">
            {textFields.map(([key, label]) => (
              <div key={key} className="grid grid-cols-[minmax(0,1fr)_repeat(3,4.5rem)] items-end gap-2 text-sm">
                <span className="pb-2">{label}</span>
                {(["x", "y", "size"] as const).map((p) => (
                  <label key={p} className="grid gap-1 text-xs text-muted-foreground">
                    {p}
                    <input
                      inputMode="decimal"
                      value={layout[key][p]}
                      onChange={(e) => setLayout({ ...layout, [key]: { ...layout[key], [p]: num(e.target.value, layout[key][p]) } })}
                      className="h-9 rounded-sm border border-input bg-surface px-2 font-mono text-sm text-foreground"
                    />
                  </label>
                ))}
              </div>
            ))}
            {(["signature", "qr"] as const).map((key) => {
              const extra = key === "signature" ? "width" : "size";
              const box = layout[key] as Record<string, number>;
              return (
                <div key={key} className="grid grid-cols-[minmax(0,1fr)_repeat(3,4.5rem)] items-end gap-2 text-sm">
                  <span className="pb-2">{key === "qr" ? "QR code" : "Signature"}</span>
                  {(["x", "y", extra] as const).map((p) => (
                    <label key={p} className="grid gap-1 text-xs text-muted-foreground">
                      {p}
                      <input
                        inputMode="decimal"
                        value={box[p]}
                        onChange={(e) => setLayout({ ...layout, [key]: { ...box, [p]: num(e.target.value, box[p]!) } })}
                        className="h-9 rounded-sm border border-input bg-surface px-2 font-mono text-sm text-foreground"
                      />
                    </label>
                  ))}
                </div>
              );
            })}
            <Button type="button" variant="ghost" size="sm" className="justify-self-start" onClick={() => setLayout(defaultTemplateLayout)}>
              <RotateCcw aria-hidden="true" /> Reset positions
            </Button>
            {errors.layout ? <p className="text-sm text-danger">{errors.layout}</p> : null}
          </div>
        </details>

        <SubmitButton className="justify-self-start">{template ? "Save template" : "Create template"}</SubmitButton>
      </div>

      <div className="grid content-start gap-2 xl:sticky xl:top-24">
        <p className="text-sm text-muted-foreground">Live preview with sample data</p>
        <div className="overflow-hidden rounded-md border border-border shadow-card">
          <CertificatePreview
            layout={layout}
            accentColor={/^#[0-9a-fA-F]{6}$/.test(fields.accentColor) ? fields.accentColor : "#1d6fe8"}
            organizationName={fields.organizationName}
            heading={fields.heading}
            bodyText={fields.bodyText}
            signatoryName={fields.signatoryName || null}
            signatoryTitle={fields.signatoryTitle || null}
            hasBackground={!!background}
            className="block h-auto w-full"
            {...sample}
          />
        </div>
        {template ? (
          <a href={`/api/admin/certificate-templates/${template.id}/preview`} target="_blank" rel="noopener" className="text-sm text-primary hover:underline">
            Open the saved design as a real PDF (with artwork and QR code) →
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">Save the template to preview the real PDF.</p>
        )}
      </div>
    </ActionForm>
  );
}
