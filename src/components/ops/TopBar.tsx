import { Link } from "@tanstack/react-router";

import { useTwin } from "@/sim/store";
import { SimulationControls } from "./SimulationControls";
import { Tag } from "./primitives";

const NAV = [
  { to: "/", label: "Live operations" },
  { to: "/conflict", label: "Conflict analysis" },
  { to: "/what-if", label: "What-if" },
  { to: "/decision", label: "Decision" },
  { to: "/scenario", label: "Scenario" },
  { to: "/performance", label: "Performance" },
  { to: "/log", label: "Decision log" },
] as const;

export function TopBar() {
  const twin = useTwin();
  const conflict = twin.primaryConflict;

  return (
    <header className="border-b border-line bg-shell">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
        <div className="flex items-baseline gap-3">
          <span className="num text-[12px] tracking-[0.18em] text-ink-dim uppercase">
            Vasai Road Digital Twin
          </span>
          <span className="label-xs">Predictive traffic decision support</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="label-xs">Section</span>
          <span className="num text-[12px] text-ink">VASAI ROAD JN · WR / DIVA</span>
        </div>

        <div className="flex items-center gap-3">
          <Tag tone={conflict ? "conflict" : "ok"}>
            {conflict ? "Conflict predicted" : "No active conflict"}
          </Tag>
          <Tag tone="warning">Simulation · {twin.speed}× real time</Tag>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-6">
          <div className="flex flex-col">
            <span className="label-xs">Simulation time IST</span>
            <span className="num text-[15px] leading-none text-ink">{twin.clock}</span>
          </div>
          <div className="flex flex-col">
            <span className="label-xs">Live state updated</span>
            <span className="num text-[12px] leading-none text-ink-dim">{twin.lastUpdate}</span>
          </div>
          <div className="flex flex-col">
            <span className="label-xs">Prediction horizon</span>
            <span className="num text-[12px] leading-none text-ink-dim">{twin.horizonClock}</span>
          </div>
          <div className="flex flex-col">
            <span className="label-xs">Data source</span>
            <span className="num text-[12px] leading-none text-warning">SYNTHETIC · DEMO FEED</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 border-t border-line px-3 py-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: item.to === "/" }}
            className="num px-2.5 py-1 text-[11px] tracking-wider text-ink-faint uppercase transition-colors hover:text-ink data-[status=active]:border-b data-[status=active]:border-selected data-[status=active]:text-selected"
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto">
          <SimulationControls />
        </div>
      </div>
    </header>
  );
}