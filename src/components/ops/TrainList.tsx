import { fmt } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { Panel, PanelHead } from "./primitives";

const STATE_TONE: Record<string, string> = {
  RUNNING: "text-ink",
  REGULATED: "text-warning",
  HELD: "text-conflict",
  REROUTED: "text-selected",
  SHUNTING: "text-freight",
  CLEARED: "text-ink-faint",
};

export function TrainList() {
  const twin = useTwin();
  const conflictIds = twin.primaryConflict
    ? [twin.primaryConflict.trainA, twin.primaryConflict.trainB]
    : [];

  return (
    <Panel className="min-h-0">
      <PanelHead
        title="Movements in section"
        meta={`${twin.states.filter((s) => s.state !== "CLEARED").length} active`}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-panel">
            <tr>
              {["Train", "Type", "Speed", "Delay", "Block", "State"].map((h) => (
                <th
                  key={h}
                  className="label-xs border-b border-line px-2.5 py-1.5 text-left font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {twin.states.map((s) => {
              const selected = twin.selectedTrainId === s.train.id;
              const inConflict = conflictIds.includes(s.train.id);
              return (
                <tr
                  key={s.train.id}
                  onClick={() => twin.selectTrain(selected ? null : s.train.id)}
                  className={`cursor-pointer border-b border-line/50 ${
                    selected ? "bg-selected/10" : inConflict ? "bg-conflict/8" : "hover:bg-raised"
                  }`}
                >
                  <td className="px-2.5 py-1.5">
                    <div className="flex flex-col">
                      <span className="num text-[11.5px] text-ink">
                        {s.train.id} · {s.train.number}
                      </span>
                      <span className="text-[10px] text-ink-faint">{s.train.name}</span>
                    </div>
                  </td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">{s.train.type}</td>
                  <td className="num px-2.5 py-1.5 text-[11.5px] text-ink">{s.speedKmh}</td>
                  <td
                    className={`num px-2.5 py-1.5 text-[11.5px] ${
                      s.delayMin >= 3 ? "text-conflict" : s.delayMin > 0 ? "text-warning" : "text-ok"
                    }`}
                  >
                    {s.delayMin > 0 ? `+${fmt(s.delayMin)}` : "0.0"}
                  </td>
                  <td className="num px-2.5 py-1.5 text-[10.5px] text-ink-dim">{s.block}</td>
                  <td
                    className={`num px-2.5 py-1.5 text-[10.5px] tracking-wide ${STATE_TONE[s.state]}`}
                  >
                    {s.state}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}