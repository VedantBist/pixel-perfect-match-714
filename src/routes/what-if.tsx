import { createFileRoute } from "@tanstack/react-router";

import { OptionsPanel } from "@/components/ops/OptionsPanel";
import { Timeline } from "@/components/ops/Timeline";
import { TwinMap } from "@/components/twin/TwinMap";

export const Route = createFileRoute("/what-if")({
  head: () => ({
    meta: [
      { title: "What-If Simulation — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Compare speed regulation, holding and rerouting for the same predicted conflict, with delay, throughput and safety outcomes from the twin.",
      },
      { property: "og:title", content: "What-If Simulation — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Simulated alternatives side by side: separation achieved, network delay, passenger and freight impact.",
      },
    ],
  }),
  component: WhatIf,
});

function WhatIf() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-[44vh] min-w-0 flex-1 border-r border-line">
          <TwinMap />
        </div>
        <div className="w-full shrink-0 lg:w-[380px]">
          <Timeline />
        </div>
      </div>
      <div className="border-t border-line">
        <OptionsPanel />
      </div>
    </div>
  );
}