import { mmss } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { Metric, Panel, PanelHead, Row, Tag } from "./primitives";

export function ConflictPanel() {
  const twin = useTwin();
  const conflict = twin.primaryConflict;
  const resolved = twin.decisionStatus === "ACCEPTED" || twin.decisionStatus === "MODIFIED";

  if (!conflict) {
    return (
      <Panel>
        <PanelHead title="Operational risk" tone="ok" />
        <div className="flex flex-1 flex-col justify-center gap-2 px-3 py-6">
          <span className="num text-[13px] tracking-wider text-ok uppercase">
            No active conflicts
          </span>
          <p className="text-[11px] leading-relaxed text-ink-dim">
            All projected movements over the planning horizon satisfy junction, headway and platform
            constraints.
          </p>
        </div>
      </Panel>
    );
  }

  const a = twin.states.find((s) => s.train.id === conflict.trainA);
  const b = twin.states.find((s) => s.train.id === conflict.trainB);

  return (
    <Panel>
      <PanelHead
        title={resolved ? "Conflict resolved" : "Predicted route conflict"}
        tone={resolved ? "ok" : "conflict"}
        meta={conflict.kind.replace(/_/g, " ")}
        right={<Tag tone={resolved ? "ok" : "conflict"}>{resolved ? "Cleared" : "Active"}</Tag>}
      />
      <div className="flex flex-col gap-3 px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="num text-[12px] text-ink">
              {a?.train.number} {a?.train.name}
            </span>
            <span className="label-xs">against</span>
            <span className="num text-[12px] text-ink">
              {b?.train.number} {b?.train.name}
            </span>
          </div>
          <Metric
            label="Time to conflict"
            value={mmss(conflict.etaS)}
            tone={resolved ? "ok" : "conflict"}
            hint={conflict.resourceLabel}
          />
        </div>

        <p className="border-l border-line-strong pl-3 text-[11.5px] leading-relaxed text-ink-dim">
          {conflict.narrative}
        </p>

        <div className="hairline-t pt-1">
          <Row
            label="Projected separation"
            value={`${Math.round(conflict.separationS)} s`}
            tone={resolved ? "ok" : "conflict"}
          />
          <Row label="Required headway" value={`${conflict.requiredHeadwayS} s`} />
          <Row label="Contended resource" value={conflict.resourceLabel} />
          <Row label="First movement" value={`${conflict.trainA} · ${a?.speedKmh ?? "—"} km/h`} />
          <Row label="Second movement" value={`${conflict.trainB} · ${b?.speedKmh ?? "—"} km/h`} />
        </div>
      </div>
    </Panel>
  );
}