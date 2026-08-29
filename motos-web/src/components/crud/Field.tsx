import { type ReactNode } from "react";

const v = (name: string) => `var(${name})`;

export function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-[13px] font-medium" style={{ color: v("--text-sub") }}>
        {label}{required && <span style={{ color: v("--gold") }}> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {error
        ? <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>{error}</p>
        : hint
          ? <p className="mt-1 text-xs" style={{ color: v("--text-muted") }}>{hint}</p>
          : null}
    </label>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: v("--gold") }}>{title}</p>
      {children}
    </div>
  );
}
