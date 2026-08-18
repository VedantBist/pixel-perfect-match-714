import { fmt } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { Metric } from "./primitives";

export function KpiStrip() {
  const twin = useTwin();
  const k = twin.kpis;
  const b = twin.baselineKpis;
  const delta = (now: number, base: number) =>
    `${now - base >= 0 ? "+" : "−"}${fmt(Math.abs(now - base))} vs no action`;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line bg-shell px-4 py-2.5 sm:grid-cols-4 lg:grid-cols-7">
      <Metric label="Trains in section" value={String(k.activeTrains)} />
      <Metric
        label="Active conflicts"
        value={String(k.activeConflicts)}
        tone={k.activeConflicts ? "conflict" : "ok"}
      />
      <Metric
        label="Total delay"
        value={fmt(k.totalDelayMin)}
        unit="min"
        tone={k.totalDelayMin > b.totalDelayMin ? "warning" : "ok"}
        hint={delta(k.totalDelayMin, b.totalDelayMin)}
      />
      <Metric label="Avg delay / train" value={fmt(k.avgDelayMin)} unit="min" />
      <Metric label="Throughput" value={fmt(k.throughputPerHour, 0)} unit="trains/h" />
      <Metric label="Platform utilisation" value={fmt(k.platformUtilisationPct, 0)} unit="%" />
      <Metric
        label="On time (±3 min)"
        value={fmt(k.onTimePct, 0)}
        unit="%"
        tone={k.onTimePct >= 80 ? "ok" : "warning"}
      />
    </div>
  );
}