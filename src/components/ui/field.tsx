import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

const CONTROL_CLASS = cn(
  "w-full rounded-base border border-border bg-surface px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
  "disabled:opacity-50",
);

/** Ce primește controlul ca să fie legat corect de etichetă, ajutor și eroare. */
type ControlBinding = {
  id: string;
  /** Se pune PE CONTROL, nu pe un înveliș: aria-describedby nu se moștenește. */
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
};

type FieldShellProps = {
  label: string;
  /** Text de ajutor sub câmp — în limbajul clientului, nu jargon. */
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (binding: ControlBinding) => ReactNode;
};

/**
 * Învelișul comun al oricărui câmp: etichetă legată de control, ajutor și eroare.
 * Componentele de mai jos îl folosesc, ca legăturile de accesibilitate să nu
 * poată fi uitate — nu depind de disciplina celui care scrie formularul.
 */
function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  const controlId = useId();
  const describedBy =
    [hint ? `${controlId}-hint` : null, error ? `${controlId}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={controlId} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <>
            {/* Asteriscul singur nu spune nimic la citire; textul ascuns îl explică. */}
            <span aria-hidden="true" className="ml-1 text-danger">
              *
            </span>
            <span className="sr-only"> (obligatoriu)</span>
          </>
        )}
      </label>

      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}

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
      {(binding) => (
        <input
          {...binding}
          className={cn(CONTROL_CLASS, error && "border-danger", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}

export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

export function SelectField({ label, hint, error, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={props.required}>
      {(binding) => (
        <select
          {...binding}
          className={cn(CONTROL_CLASS, error && "border-danger", className)}
          {...props}
        >
          {children}
        </select>
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
      {(binding) => (
        <textarea
          {...binding}
          rows={rows}
          className={cn(CONTROL_CLASS, "resize-y", error && "border-danger", className)}
          {...props}
        />
      )}
    </FieldShell>
  );
}
