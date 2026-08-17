import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside";
}) {
  return (
    <As className={cn("flex min-h-0 flex-col border border-line bg-panel", className)}>
      {children}
    </As>
  );
}

export function PanelHead({
  title,
  meta,
  tone = "neutral",
  right,
}: {
  title: string;
  meta?: string;
  tone?: "neutral" | "conflict" | "ok" | "warning";
  right?: ReactNode;
}) {
  const bar =
    tone === "conflict"
      ? "bg-conflict"
      : tone === "ok"
        ? "bg-ok"
        : tone === "warning"
          ? "bg-warning"
          : "bg-line-strong";
  return (
    <header className="flex items-center gap-3 border-b border-line px-3 py-2">
      <span className={cn("h-3 w-px", bar)} aria-hidden />
      <h2 className="label-xs text-ink-dim">{title}</h2>
      {meta ? <span className="num text-[10px] text-ink-faint">{meta}</span> : null}
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </header>
  );
}

export function Metric({
  label,
  value,
  unit,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "neutral" | "conflict" | "ok" | "warning" | "dim";
  hint?: string;
}) {
  const color =
    tone === "conflict"
      ? "text-conflict"
      : tone === "ok"
        ? "text-ok"
        : tone === "warning"
          ? "text-warning"
          : tone === "dim"
            ? "text-ink-faint"
            : "text-ink";
  return (
    <div className="flex flex-col gap-1">
      <span className="label-xs">{label}</span>
      <span className={cn("num text-[15px] leading-none tracking-tight", color)}>
        {value}
        {unit ? <span className="ml-1 text-[10px] text-ink-faint">{unit}</span> : null}
      </span>
      {hint ? <span className="text-[10px] text-ink-faint">{hint}</span> : null}
    </div>
  );
}

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "conflict" | "ok" | "warning" | "selected" | "freight";
}) {
  const map: Record<string, string> = {
    neutral: "border-line-strong text-ink-dim",
    conflict: "border-conflict/70 text-conflict",
    ok: "border-ok/60 text-ok",
    warning: "border-warning/60 text-warning",
    selected: "border-selected/60 text-selected",
    freight: "border-freight/50 text-freight",
  };
  return (
    <span
      className={cn(
        "num inline-flex items-center border px-1.5 py-[2px] text-[10px] tracking-wider uppercase",
        map[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "default",
  active,
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "quiet";
  active?: boolean;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const styles: Record<string, string> = {
    default: "border-line-strong bg-raised text-ink hover:border-selected/70",
    primary: "border-ok/70 bg-ok/12 text-ok hover:bg-ok/20",
    danger: "border-conflict/70 bg-conflict/10 text-conflict hover:bg-conflict/18",
    quiet: "border-transparent bg-transparent text-ink-dim hover:text-ink",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "num border px-2.5 py-1 text-[11px] tracking-wider uppercase transition-colors disabled:opacity-40",
        styles[variant],
        active && "border-selected bg-selected/15 text-selected",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Row({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "conflict" | "ok" | "warning";
}) {
  const color =
    tone === "conflict"
      ? "text-conflict"
      : tone === "ok"
        ? "text-ok"
        : tone === "warning"
          ? "text-warning"
          : "text-ink";
  return (
    <div className="flex items-baseline justify-between gap-4 py-[5px]">
      <span className="label-xs">{label}</span>
      <span className={cn("num text-[12px]", color)}>{value}</span>
    </div>
  );
}

export function SyntheticBadge() {
  return (
    <span className="num inline-flex items-center gap-1.5 border border-warning/50 px-1.5 py-[2px] text-[10px] tracking-wider text-warning uppercase">
      <span className="h-1.5 w-1.5 bg-warning" aria-hidden />
      Simulation scenario — synthetic data
    </span>
  );
}