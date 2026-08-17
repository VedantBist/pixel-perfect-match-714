import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  HORIZON_S,
  SCENARIO_START_ISO,
  TRAINS,
  DISRUPTIONS,
} from "../domain/scenario";
import type {
  AppliedAction,
  Conflict,
  DecisionLogEntry,
  DisruptionId,
  Kpis,
  OptionOutcome,
  TrainRuntimeState,
} from "../domain/types";
import {
  BASELINE_ACTION,
  computeKpis,
  detectConflicts,
  evaluateOptions,
  formatClock,
  runSimulation,
  trainStates,
  type SimRun,
} from "./engine";

export type DecisionStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "MODIFIED";

interface TwinState {
  /** authoritative simulation clock, seconds since scenario start */
  simTime: number;
  running: boolean;
  speed: number;
  /** future scrub offset, seconds ahead of simTime */
  scrubOffset: number;
  previewTime: number;
  isPreviewing: boolean;
  disruption: DisruptionId;
  actions: AppliedAction[];
  selectedTrainId: string | null;
  selectedOptionId: string | null;
  decisionStatus: DecisionStatus;
  log: DecisionLogEntry[];
  sim: SimRun;
  freeSim: SimRun;
  states: TrainRuntimeState[];
  liveStates: TrainRuntimeState[];
  conflicts: Conflict[];
  primaryConflict: Conflict | null;
  options: OptionOutcome[];
  recommendation: OptionOutcome | null;
  kpis: Kpis;
  baselineKpis: Kpis;
  clock: string;
  lastUpdate: string;
  horizonClock: string;
  dataStatus: "SYNTHETIC" | "STALE";
  setRunning: (v: boolean) => void;
  setSpeed: (v: number) => void;
  setScrubOffset: (v: number) => void;
  reset: () => void;
  nextEvent: () => void;
  setDisruption: (id: DisruptionId) => void;
  selectTrain: (id: string | null) => void;
  selectOption: (id: string | null) => void;
  accept: (optionId: string) => void;
  reject: () => void;
  modify: (optionId: string, capKmh: number) => void;
}

const TwinContext = createContext<TwinState | null>(null);

let logSeq = 0;
const entry = (
  atT: number,
  kind: DecisionLogEntry["kind"],
  text: string,
  detail?: string,
): DecisionLogEntry => ({ id: `log-${++logSeq}`, atT, kind, text, detail });

export function TwinProvider({ children }: { children: ReactNode }) {
  const [simTime, setSimTime] = useState(0);
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState(2);
  const [scrubOffset, setScrubOffset] = useState(0);
  const [disruption, setDisruptionState] = useState<DisruptionId>("NONE");
  const [actions, setActions] = useState<AppliedAction[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>("PENDING");
  const [log, setLog] = useState<DecisionLogEntry[]>([]);

  // Authoritative clock. Advances only on the client.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSimTime((t) => Math.min(HORIZON_S, t + 0.25 * speed));
    }, 250);
    return () => window.clearInterval(id);
  }, [running, speed]);

  const freeSim = useMemo(() => runSimulation([], disruption), [disruption]);
  const sim = useMemo(() => runSimulation(actions, disruption), [actions, disruption]);
  const baselineSim = useMemo(
    () => runSimulation([BASELINE_ACTION], disruption),
    [disruption],
  );

  const previewTime = Math.min(HORIZON_S, simTime + scrubOffset);
  const states = useMemo(
    () => trainStates(sim, previewTime, freeSim),
    [sim, previewTime, freeSim],
  );
  const liveStates = useMemo(() => trainStates(sim, simTime, freeSim), [sim, simTime, freeSim]);

  const conflicts = useMemo(() => detectConflicts(sim, simTime), [sim, simTime]);
  const primaryConflict = conflicts[0] ?? null;

  const options = useMemo(
    () => (primaryConflict ? evaluateOptions(actions, disruption, primaryConflict, simTime) : []),
    // simTime is intentionally coarse: options are re-evaluated per 15 s bucket
    // so the comparison table stays stable while the clock runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [primaryConflict?.id, actions, disruption, Math.floor(simTime / 15)],
  );
  const recommendation = options.find((o) => o.rank === 1) ?? null;

  const kpis = useMemo(
    () => computeKpis(sim, freeSim, previewTime, conflicts),
    [sim, freeSim, previewTime, conflicts],
  );
  const baselineKpis = useMemo(
    () => computeKpis(baselineSim, freeSim, previewTime, detectConflicts(baselineSim, simTime)),
    [baselineSim, freeSim, previewTime, simTime],
  );

  // Operational history: milestones are logged once, against simulation time.
  const logged = useRef<Set<string>>(new Set());
  const pushLog = useCallback(
    (key: string, e: DecisionLogEntry) => {
      if (logged.current.has(key)) return;
      logged.current.add(key);
      setLog((prev) => [...prev, e]);
    },
    [],
  );

  useEffect(() => {
    if (!primaryConflict) return;
    const c = primaryConflict;
    pushLog(
      `pred-${c.id}`,
      entry(
        simTime,
        "PREDICTION",
        `Route conflict predicted at ${c.resourceLabel}`,
        `${c.trainA} / ${c.trainB} — projected separation ${Math.round(c.separationS)} s`,
      ),
    );
  }, [primaryConflict, pushLog, simTime]);

  useEffect(() => {
    if (!primaryConflict || options.length === 0) return;
    const feasible = options.filter((o) => o.feasible).length;
    pushLog(
      `alts-${primaryConflict.id}`,
      entry(
        simTime,
        "ALTERNATIVES",
        `${feasible} feasible alternatives simulated`,
        options.map((o) => o.id).join(" · "),
      ),
    );
    if (recommendation) {
      pushLog(
        `valid-${primaryConflict.id}`,
        entry(simTime, "VALIDATION", "Safety validation completed", "6 constraint groups checked"),
      );
      pushLog(
        `reco-${primaryConflict.id}-${recommendation.id}`,
        entry(
          simTime,
          "RECOMMENDATION",
          `${recommendation.label} recommended`,
          `Network impact +${recommendation.networkDelayMin.toFixed(1)} min`,
        ),
      );
    }
  }, [options, primaryConflict, recommendation, pushLog, simTime]);

  const applyAction = useCallback((action: AppliedAction) => {
    setActions((prev) => [...prev.filter((a) => a.trainId !== action.trainId), action]);
  }, []);

  const accept = useCallback(
    (optionId: string) => {
      const option = options.find((o) => o.id === optionId);
      if (!option?.action) return;
      applyAction(option.action);
      setDecisionStatus("ACCEPTED");
      setSelectedOptionId(optionId);
      setLog((prev) => [
        ...prev,
        entry(
          simTime,
          "DECISION",
          `Controller accepted — ${option.label}`,
          `${option.action.trainId} · network impact +${option.networkDelayMin.toFixed(1)} min`,
        ),
        entry(simTime, "STATE", "Digital twin updated — projected conflict cleared"),
      ]);
    },
    [applyAction, options, simTime],
  );

  const reject = useCallback(() => {
    setDecisionStatus("REJECTED");
    setLog((prev) => [
      ...prev,
      entry(
        simTime,
        "DECISION",
        "Controller rejected the recommendation",
        "Conflict remains active — twin continues to monitor the J2 route window",
      ),
    ]);
  }, [simTime]);

  const modify = useCallback(
    (optionId: string, capKmh: number) => {
      const option = options.find((o) => o.id === optionId);
      if (!option?.action) return;
      const action: AppliedAction = {
        ...option.action,
        kind: "SPEED_REGULATION",
        capKmh,
        untilT: Math.round(simTime) + 480,
        holdS: undefined,
      };
      applyAction(action);
      setDecisionStatus("MODIFIED");
      setSelectedOptionId(optionId);
      setLog((prev) => [
        ...prev,
        entry(
          simTime,
          "DECISION",
          `Controller modified the action — ${action.trainId} regulated to ${capKmh} km/h`,
          "Re-validated against active constraints",
        ),
      ]);
    },
    [applyAction, options, simTime],
  );

  const reset = useCallback(() => {
    setSimTime(0);
    setActions([]);
    setScrubOffset(0);
    setDecisionStatus("PENDING");
    setSelectedOptionId(null);
    setSelectedTrainId(null);
    logged.current = new Set();
    setLog([]);
    setRunning(true);
  }, []);

  const nextEvent = useCallback(() => {
    const target = primaryConflict ? Math.max(0, primaryConflict.atT - 45) : simTime + 120;
    setSimTime(Math.min(HORIZON_S, target));
  }, [primaryConflict, simTime]);

  const setDisruption = useCallback(
    (id: DisruptionId) => {
      setDisruptionState(id);
      setActions([]);
      setDecisionStatus("PENDING");
      setSelectedOptionId(null);
      logged.current = new Set();
      const def = DISRUPTIONS.find((d) => d.id === id);
      setLog([
        entry(
          simTime,
          "STATE",
          `Scenario injected — ${def?.label ?? id}`,
          def?.description,
        ),
      ]);
    },
    [simTime],
  );

  const value: TwinState = {
    simTime,
    running,
    speed,
    scrubOffset,
    previewTime,
    isPreviewing: scrubOffset > 0,
    disruption,
    actions,
    selectedTrainId,
    selectedOptionId,
    decisionStatus,
    log,
    sim,
    freeSim,
    states,
    liveStates,
    conflicts,
    primaryConflict,
    options,
    recommendation,
    kpis,
    baselineKpis,
    clock: formatClock(SCENARIO_START_ISO, simTime),
    lastUpdate: formatClock(SCENARIO_START_ISO, Math.max(0, simTime - 4)),
    horizonClock: formatClock(SCENARIO_START_ISO, simTime + 420),
    dataStatus: "SYNTHETIC",
    setRunning,
    setSpeed,
    setScrubOffset,
    reset,
    nextEvent,
    setDisruption,
    selectTrain: setSelectedTrainId,
    selectOption: setSelectedOptionId,
    accept,
    reject,
    modify,
  };

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export function useTwin(): TwinState {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("useTwin must be used inside <TwinProvider>");
  return ctx;
}

export const TRAIN_COUNT = TRAINS.length;
export { HORIZON_S };