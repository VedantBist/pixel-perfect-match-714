import { useTwin } from "@/sim/store";
import { Btn } from "./primitives";

export function SimulationControls() {
  const twin = useTwin();
  return (
    <div className="flex items-center gap-1.5">
      <span className="label-xs">Simulation</span>
      <Btn onClick={() => twin.setRunning(!twin.running)} active={twin.running}>
        {twin.running ? "Pause" : "Start"}
      </Btn>
      <Btn onClick={twin.nextEvent}>Next event</Btn>
      <Btn onClick={twin.reset}>Reset</Btn>
      <span className="label-xs ml-2">Rate</span>
      {[1, 2, 5, 10].map((s) => (
        <Btn key={s} active={twin.speed === s} onClick={() => twin.setSpeed(s)}>
          {s}×
        </Btn>
      ))}
    </div>
  );
}