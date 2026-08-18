import { createFileRoute } from "@tanstack/react-router";

import { ConflictPanel } from "@/components/ops/ConflictPanel";
import { DecisionLog } from "@/components/ops/DecisionLog";
import { Timeline } from "@/components/ops/Timeline";
import { TrainList } from "@/components/ops/TrainList";
import { TwinMap } from "@/components/twin/TwinMap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vasai Road Digital Twin — Live Junction Operations" },
      {
        name: "description",
        content:
          "Predictive digital twin for Vasai Road Junction: live train state, conflict prediction and simulated decision support for section controllers.",
      },
      { property: "og:title", content: "Vasai Road Digital Twin — Live Junction Operations" },
      {
        property: "og:description",
        content:
          "Live junction state, predicted route conflicts and simulation-backed recommendations for railway traffic controllers.",
      },
    ],
  }),
  component: LiveOperations,
});

function LiveOperations() {
  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <div className="flex min-h-[62vh] min-w-0 flex-1 flex-col border-r border-line">
        <TwinMap />
        <div className="border-t border-line">
          <Timeline />
        </div>
      </div>
      <aside className="flex w-full shrink-0 flex-col gap-0 xl:w-[420px]">
        <ConflictPanel />
        <div className="min-h-[280px] flex-1 border-t border-line">
          <TrainList />
        </div>
        <div className="h-[220px] border-t border-line">
          <DecisionLog className="h-full" />
        </div>
      </aside>
    </div>
  );
}