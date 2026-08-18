import { HORIZON_S, useTwin } from "@/sim/store";
import { mmss } from "@/sim/engine";
import { Btn, Panel, PanelHead } from "./primitives";

const MARKS = [0, 120, 240, 360, 480, 600];
const MAX = 600;

export function Timeline() {
  const twin = useTwin();
  const conflict = twin.primaryConflict;
  const resolved = twin.decisionStatus === "ACCEPTED" || twin.decisionStatus === "MODIFIED";
  const conflictPct = conflict ? Math.min(100, Math.max(0, (conflict.etaS / MAX) * 100)) : null;

  return (
    <Panel>
      <PanelHead
        title="Future state timeline"
        meta={`Horizon ${mmss(HORIZON_S)} · scrub T+${mmss(twin.scrubOffset)}`}
        right={
          <Btn onClick={() => twin.setScrubOffset(0)} disabled={twin.scrubOffset === 0}>
            Return to now
          </Btn>
        }
      />
      <div className="px-3 py-3">
        <div className="relative h-12">
          <div className="absolute top-5 h-px w-full bg-line-strong" />
          {MARKS.map((m) => (
            <div
              key={m}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${(m / MAX) * 100}%`, transform: "translateX(-50%)" }}
            >
              <span className="label-xs">{m === 0 ? "NOW" : `T+${m / 60}m`}</span>
              <span className="mt-2 h-3 w-px bg-line-strong" />
            </div>
          ))}
          {conflict && conflictPct != null ? (
            <div
              className="absolute top-6 flex flex-col items-center"
              style={{ left: `${conflictPct}%`, transform: "translateX(-50%)" }}
            >
              <span className={`h-5 w-[2px] ${resolved ? "bg-ok" : "bg-conflict"}`} />
              <span
                className={`num mt-1 text-[10px] whitespace-nowrap ${resolved ? "text-ok" : "text-conflict"}`}
              >
                {resolved ? "CLEARED" : "CONFLICT"} {mmss(conflict.etaS)}
              </span>
            </div>
          ) : null}
        </div>

        <input
          type="range"
          min={0}
          max={MAX}
          step={5}
          value={twin.scrubOffset}
          onChange={(e) => twin.setScrubOffset(Number(e.target.value))}
          aria-label="Scrub future simulation time"
          className="mt-2 h-1 w-full appearance-none bg-line-strong accent-selected"
        />

        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[0, 120, 300, 420].map((offset) => (
            <button
              key={offset}
              type="button"
              onClick={() => twin.setScrubOffset(offset)}
              className={`num border px-2 py-1 text-left text-[11px] tracking-wide uppercase ${
                twin.scrubOffset === offset
                  ? "border-selected text-selected"
                  : "border-line text-ink-dim hover:border-line-strong"
              }`}
            >
              {offset === 0 ? "Now" : `T + ${offset / 60} min`}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}