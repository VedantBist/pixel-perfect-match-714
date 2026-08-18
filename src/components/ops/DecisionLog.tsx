import { mmss } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { Panel, PanelHead } from "./primitives";

const KIND_TONE: Record<string, string> = {
  PREDICTION: "text-conflict",
  ALTERNATIVES: "text-selected",
  VALIDATION: "text-warning",
  RECOMMENDATION: "text-selected",
  DECISION: "text-ok",
  STATE: "text-ink-dim",
};

export function DecisionLog({ className }: { className?: string | undefined }) {
  const twin = useTwin();
  return (
    <Panel className={className}>
      <PanelHead title="Decision trace" meta="Prediction → alternatives → validation → decision" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {twin.log.length === 0 ? (
          <p className="text-[11px] text-ink-dim">
            The trace records every prediction, evaluation and controller action in order.
          </p>
        ) : (
          <ol className="flex flex-col">
            {twin.log.map((e) => (
              <li key={e.id} className="flex gap-3 border-b border-line/50 py-1.5 last:border-b-0">
                <span className="num w-12 shrink-0 text-[10.5px] text-ink-faint">
                  {mmss(e.atT)}
                </span>
                <span
                  className={`num w-24 shrink-0 text-[10px] tracking-wider uppercase ${KIND_TONE[e.kind]}`}
                >
                  {e.kind}
                </span>
                <span className="flex flex-col">
                  <span className="text-[11.5px] leading-snug text-ink">{e.text}</span>
                  {e.detail ? (
                    <span className="num text-[10px] text-ink-faint">{e.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Panel>
  );
}