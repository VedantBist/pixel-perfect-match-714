import { fmt } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { Btn, Panel, PanelHead, Tag } from "./primitives";

const HEADERS = [
  "Option",
  "Feasible",
  "Conflict",
  "Separation",
  "Network delay",
  "Passenger",
  "Freight",
  "Throughput",
  "Infra impact",
  "",
];

export function OptionsPanel({ dense = false }: { dense?: boolean }) {
  const twin = useTwin();
  const recommended = twin.recommendation;

  if (!twin.options.length) {
    return (
      <Panel>
        <PanelHead title="Alternative strategies" />
        <div className="px-3 py-6 text-[11px] text-ink-dim">
          Alternatives are generated when the twin predicts a constraint violation.
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHead
        title="Alternative strategies — simulated outcomes"
        meta={`${twin.options.length} evaluated against the same prediction horizon`}
        right={
          twin.selectedOptionId ? (
            <Btn variant="quiet" onClick={() => twin.selectOption(null)}>
              Clear preview
            </Btn>
          ) : null
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="label-xs border-b border-line px-3 py-1.5 whitespace-nowrap font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {twin.options.map((opt) => {
              const isRec = recommended?.id === opt.id;
              const isSelected = twin.selectedOptionId === opt.id;
              return (
                <tr
                  key={opt.id}
                  onClick={() => twin.selectOption(opt.id)}
                  className={`cursor-pointer border-b border-line/60 align-top transition-colors ${
                    isSelected ? "bg-selected/10" : "hover:bg-raised"
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className="num flex items-center gap-2 text-[12px] text-ink">
                        {opt.label}
                        {isRec ? <Tag tone="ok">Recommended</Tag> : null}
                      </span>
                      {!dense ? (
                        <span className="max-w-[26rem] text-[10.5px] leading-relaxed text-ink-faint">
                          {opt.summary}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <Cell tone={opt.feasible ? "ok" : "conflict"}>{opt.feasible ? "YES" : "NO"}</Cell>
                  <Cell tone={opt.conflictResolved ? "ok" : "conflict"}>
                    {opt.conflictResolved ? "RESOLVED" : "PERSISTS"}
                  </Cell>
                  <Cell
                    tone={opt.separationS >= 90 ? "ok" : opt.separationS >= 60 ? "warning" : "conflict"}
                  >
                    {Math.round(opt.separationS)} s
                  </Cell>
                  <Cell>{fmt(opt.networkDelayMin)} min</Cell>
                  <Cell>{fmt(opt.passengerDelayMin)} min</Cell>
                  <Cell>{fmt(opt.freightDelayMin)} min</Cell>
                  <Cell>{fmt(opt.throughputPerHour, 0)} /h</Cell>
                  <Cell tone={opt.infrastructureChange === "NONE" ? "ok" : "warning"}>
                    {opt.infrastructureChange}
                  </Cell>
                  <td className="px-3 py-2 text-right">
                    <Btn
                      active={isSelected}
                      onClick={() => twin.selectOption(opt.id)}
                      title="Preview this option in the twin"
                    >
                      Preview
                    </Btn>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-3 py-2 text-[10px] text-ink-faint">
        Every figure above is produced by the same deterministic simulation engine driving the twin.
        Ranking weighs safety feasibility first, then network delay, passenger impact and
        infrastructure disturbance.
      </p>
    </Panel>
  );
}

function Cell({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warning" | "conflict";
}) {
  const color =
    tone === "ok"
      ? "text-ok"
      : tone === "warning"
        ? "text-warning"
        : tone === "conflict"
          ? "text-conflict"
          : "text-ink";
  return <td className={`num px-3 py-2 text-[11.5px] whitespace-nowrap ${color}`}>{children}</td>;
}