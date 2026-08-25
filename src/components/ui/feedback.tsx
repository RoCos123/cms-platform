import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Cele trei stări de publicare din audit (Draft / Publicat / Retras) erau
 * neexplicate în original — utilizatorul nu știa ce înseamnă „Unpublished".
 * Aici fiecare stare are și o descriere, folosită ca tooltip.
 */
const STATUS = {
  draft: { label: "Ciornă", hint: "Nepublicat încă. Doar tu îl vezi.", tone: "muted" },
  published: { label: "Publicat", hint: "Vizibil pe site.", tone: "success" },
  unpublished: {
    label: "Retras",
    hint: "A fost publicat, apoi retras de pe site.",
    tone: "warning",
  },
} as const;

export type StatusValue = keyof typeof STATUS;

const TONES = {
  muted: "bg-surface-muted text-muted-foreground",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
} as const;

export function StatusBadge({ status }: { status: StatusValue }) {
  const { label, hint, tone } = STATUS[status];

  return (
    <span
      title={hint}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-base bg-danger-surface px-3 py-2 text-xs text-danger">{children}</p>
  );
}
