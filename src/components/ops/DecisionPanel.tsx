import { useState } from "react";

import { fmt } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { SafetyValidationList } from "./SafetyValidationList";
import { Btn, Panel, PanelHead, Row, Tag } from "./primitives";

export function DecisionPanel() {
  const twin = useTwin();
  const active =
    twin.options.find((o) => o.id === twin.selectedOptionId) ?? twin.recommendation ?? null;
  const [cap, setCap] = useState(26);
  const status = twin.decisionStatus;

  if (!active) {
    return (
      <Panel>
        <PanelHead title="Controller decision" />
        <div className="px-3 py-6 text-[11px] text-ink-dim">
          No recommendation pending. The twin continues monitoring the section.
        </div>
      </Panel>
    );
  }

  const settled = status === "ACCEPTED" || status === "MODIFIED";

  return (
    <Panel>
      <PanelHead
        title="Controller decision"
        tone={settled ? "ok" : "warning"}
        meta="Human-in-the-loop — the twin never actuates"
        right={
          <Tag tone={settled ? "ok" : status === "REJECTED" ? "conflict" : "warning"}>{status}</Tag>
        }
      />
      <div className="flex flex-col gap-3 px-3 py-3">
        <div className="flex flex-col gap-1">
          <span className="label-xs">Recommended action</span>
          <span className="num text-[13px] text-ink">{active.label}</span>
          <p className="text-[11px] leading-relaxed text-ink-dim">{active.summary}</p>
        </div>

        <div className="hairline-t pt-1">
          <Row
            label="Conflict outcome"
            value={active.conflictResolved ? "Resolved" : "Persists"}
            tone={active.conflictResolved ? "ok" : "conflict"}
          />
          <Row label="Resulting separation" value={`${Math.round(active.separationS)} s`} />
          <Row label="Network delay" value={`${fmt(active.networkDelayMin)} min`} />
          <Row label="Route change required" value={active.routeChange ? "Yes" : "No"} />
          <Row label="Infrastructure impact" value={active.infrastructureChange} />
        </div>

        <div className="hairline-t pt-2">
          <SafetyValidationList validation={active.safety} />
        </div>

        <div className="hairline-t flex flex-wrap items-center gap-2 pt-3">
          <Btn
            variant="primary"
            onClick={() => twin.accept(active.id)}
            disabled={!active.feasible || settled}
          >
            Accept & apply to twin
          </Btn>
          <Btn variant="danger" onClick={twin.reject} disabled={settled}>
            Reject
          </Btn>
          <div className="flex items-center gap-1.5">
            <span className="label-xs">Modify cap</span>
            <input
              type="number"
              min={15}
              max={80}
              step={1}
              value={cap}
              onChange={(e) => setCap(Number(e.target.value))}
              className="num w-16 border border-line-strong bg-raised px-1.5 py-1 text-[11px] text-ink"
              aria-label="Modified speed cap in km/h"
            />
            <span className="label-xs">km/h</span>
            <Btn onClick={() => twin.modify(active.id, cap)} disabled={settled}>
              Modify & apply
            </Btn>
          </div>
        </div>

        <p className="text-[10px] leading-relaxed text-ink-faint">
          Accepting writes the action into the twin state and re-runs the prediction. Nothing is sent
          to field signalling; this is a decision-support record.
        </p>
      </div>
    </Panel>
  );
}