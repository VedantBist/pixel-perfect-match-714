import { createFileRoute } from "@tanstack/react-router";

import { Metric, Panel, PanelHead, Row } from "@/components/ops/primitives";
import { fmt } from "@/sim/engine";
import { useTwin } from "@/sim/store";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Section Performance — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Measured effect of controller decisions at Vasai Road: delay, throughput, punctuality and utilisation against the no-action baseline.",
      },
      { property: "og:title", content: "Section Performance — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Quantified decision impact: delay minutes saved, throughput and punctuality versus baseline.",
      },
    ],
  }),
  component: Performance,
});

function Bar({ label, value, max, tone }: { label: string; value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-baseline justify-between">
        <span className="label-xs">{label}</span>
        <span className="num text-[11.5px] text-ink">{fmt(value)} min</span>
      </div>
      <div className="h-2 w-full bg-raised">
        <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Performance() {
  const twin = useTwin();
  const k = twin.kpis;
  const b = twin.baselineKpis;
  const saved = b.totalDelayMin - k.totalDelayMin;
  const max = Math.max(k.totalDelayMin, b.totalDelayMin, 1);

  return (
    <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-3">
      <Panel className="border-r">
        <PanelHead
          title="Decision impact"
          tone={saved >= 0 ? "ok" : "warning"}
          meta="Twin decision vs no-action baseline"
        />
        <div className="flex flex-col gap-3 px-3 py-3">
          <Metric
            label="Delay avoided"
            value={`${saved >= 0 ? "" : "−"}${fmt(Math.abs(saved))}`}
            unit="min"
            tone={saved >= 0 ? "ok" : "conflict"}
            hint="Across all movements in section"
          />
          <div className="hairline-t pt-2">
            <Bar label="With decision" value={k.totalDelayMin} max={max} tone="bg-ok" />
            <Bar label="No action baseline" value={b.totalDelayMin} max={max} tone="bg-conflict" />
          </div>
        </div>
      </Panel>

      <Panel className="border-r">
        <PanelHead title="Delay composition" meta="By traffic class" />
        <div className="px-3 py-3">
          <Row label="Passenger delay" value={`${fmt(k.passengerDelayMin)} min`} />
          <Row label="Freight delay" value={`${fmt(k.freightDelayMin)} min`} />
          <Row label="Average per train" value={`${fmt(k.avgDelayMin)} min`} />
          <Row
            label="On time within ±3 min"
            value={`${fmt(k.onTimePct, 0)} %`}
            tone={k.onTimePct >= 80 ? "ok" : "warning"}
          />
          <p className="pt-3 text-[10.5px] leading-relaxed text-ink-faint">
            Passenger minutes are weighted separately from freight because the operational cost of a
            hold differs sharply between them — the ranking uses both.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Capacity utilisation" meta="Section throughput and occupancy" />
        <div className="px-3 py-3">
          <Row label="Throughput" value={`${fmt(k.throughputPerHour, 0)} trains/h`} />
          <Row label="Baseline throughput" value={`${fmt(b.throughputPerHour, 0)} trains/h`} />
          <Row label="Platform utilisation" value={`${fmt(k.platformUtilisationPct, 0)} %`} />
          <Row label="Route utilisation" value={`${fmt(k.routeUtilisationPct, 0)} %`} />
          <Row
            label="Active conflicts"
            value={String(k.activeConflicts)}
            tone={k.activeConflicts ? "conflict" : "ok"}
          />
          <p className="pt-3 text-[10.5px] leading-relaxed text-ink-faint">
            Utilisation is computed from projected occupancy of the J2 throat, platform lines and
            goods loop over the prediction horizon.
          </p>
        </div>
      </Panel>
    </div>
  );
}