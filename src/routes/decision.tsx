import { createFileRoute } from "@tanstack/react-router";

import { DecisionLog } from "@/components/ops/DecisionLog";
import { DecisionPanel } from "@/components/ops/DecisionPanel";
import { OptionsPanel } from "@/components/ops/OptionsPanel";
import { TwinMap } from "@/components/twin/TwinMap";

export const Route = createFileRoute("/decision")({
  head: () => ({
    meta: [
      { title: "Controller Decision — Vasai Road Digital Twin" },
      {
        name: "description",
        content:
          "Accept, modify or reject the twin's recommendation. Safety validation is shown before the action is written into the twin state.",
      },
      { property: "og:title", content: "Controller Decision — Vasai Road Digital Twin" },
      {
        property: "og:description",
        content:
          "Human-in-the-loop decision surface with safety validation and a full decision trace.",
      },
    ],
  }),
  component: DecisionView,
});

function DecisionView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
      <div className="flex min-w-0 flex-1 flex-col border-r border-line">
        <div className="min-h-[42vh]">
          <TwinMap />
        </div>
        <div className="border-t border-line">
          <OptionsPanel dense />
        </div>
        <div className="min-h-[200px] flex-1 border-t border-line">
          <DecisionLog className="h-full" />
        </div>
      </div>
      <aside className="w-full shrink-0 xl:w-[440px]">
        <DecisionPanel />
      </aside>
    </div>
  );
}