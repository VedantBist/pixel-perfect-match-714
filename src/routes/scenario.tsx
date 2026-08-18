import { createFileRoute } from "@tanstack/react-router";

import { DISRUPTIONS, TRAINS } from "@/domain/scenario";
import { Btn, Panel, PanelHead, Row, Tag } from "@/components/ops/primitives";
import { useTwin } from "@/sim/store";

export const Route = createFileRoute("/scenario")({
  head: () => ({
    meta: [
      { title: "Scenario & Disruptions — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Inject disruptions into the Vasai Road scenario — late freight, withdrawn platform, signal failure, peak traffic — and watch the twin re-predict.",
      },
      { property: "og:title", content: "Scenario & Disruptions — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Configure the synthetic evening-peak scenario and disruption injections used by the twin.",
      },
    ],
  }),
  component: ScenarioView,
});

function ScenarioView() {
  const twin = useTwin();
  const active = DISRUPTIONS.find((d) => d.id === twin.disruption);

  return (
    <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <Panel className="border-r">
        <PanelHead title="Disruption injection" meta="Re-runs the prediction immediately" />
        <div className="flex flex-col gap-2 px-3 py-3">
          {DISRUPTIONS.map((d) => {
            const selected = twin.disruption === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => twin.setDisruption(d.id)}
                className={`flex flex-col gap-1 border px-3 py-2 text-left transition-colors ${
                  selected
                    ? "border-selected bg-selected/10"
                    : "border-line hover:border-line-strong"
                }`}
              >
                <span className="num flex items-center gap-2 text-[12px] text-ink">
                  {d.label}
                  {d.note ? <Tag tone="warning">{d.note}</Tag> : null}
                  {selected ? <Tag tone="selected">Applied</Tag> : null}
                </span>
                <span className="text-[11px] leading-relaxed text-ink-dim">{d.description}</span>
              </button>
            );
          })}
          <div className="hairline-t flex items-center gap-2 pt-3">
            <Btn onClick={twin.reset}>Reset scenario</Btn>
            <span className="label-xs">
              Active: {active?.label ?? "Baseline"} · clock {twin.clock}
            </span>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHead title="Scenario roster" meta={`${TRAINS.length} scheduled movements`} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-panel">
              <tr>
                {["Train", "Type", "Dir", "Origin → Destination", "Cruise", "PF", "Prio"].map(
                  (h) => (
                    <th
                      key={h}
                      className="label-xs border-b border-line px-2.5 py-1.5 text-left font-normal"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {TRAINS.map((t) => (
                <tr key={t.id} className="border-b border-line/50">
                  <td className="px-2.5 py-1.5">
                    <span className="num text-[11.5px] text-ink">
                      {t.id} · {t.number}
                    </span>
                    <span className="block text-[10px] text-ink-faint">{t.name}</span>
                  </td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">{t.type}</td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">{t.direction}</td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">
                    {t.origin} → {t.destination}
                  </td>
                  <td className="num px-2.5 py-1.5 text-[11px] text-ink">{t.cruiseKmh} km/h</td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">
                    {t.platform ?? "—"}
                  </td>
                  <td className="num px-2.5 py-1.5 text-[11px] text-ink-dim">P{t.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-line px-3 py-2">
          <Row label="Data provenance" value="Synthetic scenario, deterministic seed" />
          <Row label="Prediction method" value="1 s numerical integration over route geometry" />
          <Row label="Conflict basis" value="Resource occupancy + required headway" />
        </div>
      </Panel>
    </div>
  );
}