import { Label } from "@/components/ui/label";
import { FieldError } from "./field";

/** Native <select> styled like inputs: accessible, works without JS, fine on mobile. */
export function SelectField({
  name,
  id: idProp,
  label,
  options,
  defaultValue,
  error,
  hint,
  onChange,
}: {
  name: string;
  /** Needed when two forms on one page share a field name (ids must be unique). */
  id?: string;
  label: string;
  options: { value: string; label: string }[];
  defaultValue?: string | undefined;
  error?: string | undefined;
  hint?: string;
  /** Only usable when rendered inside a Client Component. */
  onChange?: (value: string) => void;
}) {
  const id = idProp ?? `field-${name}`;
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        {...(onChange ? { onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) } : {})}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="h-11 w-full min-w-0 rounded-sm border border-input bg-surface px-3 text-base"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} error={error} />
    </div>
  );
}
