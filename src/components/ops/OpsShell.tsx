import type { ReactNode } from "react";

import { TwinProvider } from "@/sim/store";
import { KpiStrip } from "./KpiStrip";
import { TopBar } from "./TopBar";

export function OpsShell({ children }: { children: ReactNode }) {
  return (
    <TwinProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <TopBar />
        <KpiStrip />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <footer className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-line bg-shell px-4 py-1.5">
          <span className="label-xs">
            Vasai Road Junction · predictive decision support prototype
          </span>
          <span className="label-xs">
            Synthetic scenario data — not connected to live railway systems
          </span>
          <span className="label-xs ml-auto">
            Advisory only · signalling and interlocking remain authoritative
          </span>
        </footer>
      </div>
    </TwinProvider>
  );
}