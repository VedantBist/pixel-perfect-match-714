import { createFileRoute } from "@tanstack/react-router";

import { DecisionLog } from "@/components/ops/DecisionLog";
import { Panel, PanelHead, Row } from "@/components/ops/primitives";
import { mmss } from "@/sim/engine";
import { useTwin } from "@/sim/store";

export const Route = createFileRoute("/log")({
  head: () => ({
    meta: [
      { title: "Decision Log — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Auditable trace of every prediction, alternative evaluation, safety validation and controller decision recorded by the twin.",
      },
      { property: "og:title", content: "Decision Log — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Complete audit trail linking predictions to the actions a controller accepted, modified or rejected.",
      },
    ],
  }),
  component: LogView,
});

function LogView() {
  const twin = useTwin();

  return (
    <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <DecisionLog className="border-r border-line" />
      <Panel>
        <PanelHead title="Applied actions" meta="Written into the twin state" />
        <div className="px-3 py-3">
          {twin.actions.length === 0 ? (
            <p className="text-[11px] text-ink-dim">
              No controller action applied. The twin is reporting the free-running prediction.
            </p>
          ) : (
            twin.actions.map((a, i) => (
              <div key={`${a.trainId}-${i}`} className="hairline-t py-2 first:border-t-0">
                <Row label="Action" value={a.kind.replace(/_/g, " ")} tone="ok" />
                <Row label="Train" value={a.trainId} />
                <Row label="Effective from" value={mmss(a.fromT)} />
                {a.capKmh ? <Row label="Speed cap" value={`${a.capKmh} km/h`} /> : null}
                {a.untilT ? <Row label="Restriction until" value={mmss(a.untilT)} /> : null}
                {a.holdS ? <Row label="Hold duration" value={mmss(a.holdS)} /> : null}
                {a.routeKey ? <Row label="Route" value={a.routeKey} /> : null}
              </div>
            ))
          )}
          <div className="hairline-t mt-2 pt-2">
            <Row label="Decision status" value={twin.decisionStatus} />
            <Row label="Entries recorded" value={String(twin.log.length)} />
          </div>
        </div>
      </Panel>
    </div>
  );
}