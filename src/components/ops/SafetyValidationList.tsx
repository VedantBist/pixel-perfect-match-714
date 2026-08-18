import type { SafetyValidation } from "@/domain/types";
import { Tag } from "./primitives";

export function SafetyValidationList({ validation }: { validation: SafetyValidation }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 pb-2">
        <span className="label-xs">Safety validation</span>
        <Tag tone={validation.status === "PASSED" ? "ok" : "conflict"}>{validation.status}</Tag>
      </div>
      <ul className="flex flex-col">
        {validation.checks.map((check) => (
          <li
            key={check.id}
            className="flex items-baseline justify-between gap-3 border-b border-line/60 py-1 last:border-b-0"
          >
            <div className="flex flex-col">
              <span className="num text-[11px] text-ink">{check.label}</span>
              <span className="text-[10px] text-ink-faint">{check.detail}</span>
            </div>
            <span
              className={`num shrink-0 text-[10px] tracking-wider uppercase ${
                check.status === "PASSED"
                  ? "text-ok"
                  : check.status === "FAILED"
                    ? "text-conflict"
                    : "text-ink-faint"
              }`}
            >
              {check.status === "NOT_APPLICABLE" ? "N/A" : check.status}
            </span>
          </li>
        ))}
      </ul>
      <p className="pt-2 text-[10px] leading-relaxed text-ink-faint">
        Constraints are evaluated inside the twin. Signalling, interlocking and train protection
        remain with the existing railway systems — the twin recommends, the controller decides.
      </p>
    </div>
  );
}