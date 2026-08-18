import { createFileRoute } from "@tanstack/react-router";

import { ConflictPanel } from "@/components/ops/ConflictPanel";
import { Timeline } from "@/components/ops/Timeline";
import { TrainList } from "@/components/ops/TrainList";
import { TwinMap } from "@/components/twin/TwinMap";

export const Route = createFileRoute("/conflict")({
  head: () => ({
    meta: [
      { title: "Conflict Analysis — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Inspect predicted junction contention at Vasai Road: time to conflict, projected separation, contended resource and required headway.",
      },
      { property: "og:title", content: "Conflict Analysis — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Why the twin flagged a conflict: separation, headway and resource occupancy over the prediction horizon.",
      },
    ],
  }),
  component: ConflictAnalysis,
});

function ConflictAnalysis() {
  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col gap-0">
        <div className="min-h-[52vh] border-r border-line">
          <TwinMap />
        </div>
        <div className="border-t border-r border-line">
          <Timeline />
        </div>
      </div>
      <aside className="flex w-full shrink-0 flex-col xl:w-[430px]">
        <ConflictPanel />
        <div className="min-h-[320px] flex-1 border-t border-line">
          <TrainList />
        </div>
      </aside>
    </div>
  );
}