import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL_CLASS = cn(
  "w-full rounded-base border border-border bg-surface px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
  "disabled:opacity-50",
);

type FieldShellProps = {
  label: string;
  /** Text de ajutor sub câmp — în limbajul clientului, nu jargon. */
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (controlId: string) => ReactNode;
};

/**
 * Învelișul comun al oricărui câmp: etichetă legată corect de control, ajutor și
 * eroare. Componentele de mai jos îl folosesc, ca eticheta să nu fie niciodată
 * uitată — accesibilitatea nu depinde de disciplina celui care scrie formularul.
 */
function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const controlId = useId();
  const describedBy = [hint ? `${controlId}-hint` : null, error ? `${controlId}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1.5">
      <label htmlFor={controlId} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-1 text-danger">*</span>}
      </label>

      <div aria-describedby={describedBy || undefined}>{children(controlId)}</div>

      {hint && (
        <p id={`${controlId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${controlId}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {(id) => (
        <input
          id={id}
          className={cn(CONTROL_CLASS, error && "border-danger", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function TextAreaField({
  label,
  hint,
  error,
  className,
  rows = 3,
  ...props
}: TextAreaFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          className={cn(CONTROL_CLASS, "resize-y", error && "border-danger", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}
