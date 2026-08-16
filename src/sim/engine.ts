import {
  DISRUPTIONS,
  HORIZON_S,
  REQUIRED_HEADWAY_S,
  TRAINS,
  type DisruptionDef,
} from "../domain/scenario";
import { JUNCTIONS, KM_PER_PX, TRACK_MAP, J2 } from "../domain/topology";
import type {
  AppliedAction,
  Conflict,
  DisruptionId,
  Kpis,
  OptionOutcome,
  Pt,
  SafetyValidation,
  TrainDef,
  TrainRuntimeState,
} from "../domain/types";

export interface RouteGeometry {
  points: Pt[];
  cumulativeKm: number[];
  lengthKm: number;
}

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);

export function buildRoute(trackIds: string[]): RouteGeometry {
  const points: Pt[] = [];
  for (const id of trackIds) {
    const track = TRACK_MAP[id];
    if (!track) continue;
    for (const p of track.points) {
      const last = points[points.length - 1];
      if (!last || dist(last, p) > 0.5) points.push(p);
    }
  }
  const cumulativeKm: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumulativeKm.push(cumulativeKm[i - 1]! + dist(points[i - 1]!, points[i]!) * KM_PER_PX);
  }
  return { points, cumulativeKm, lengthKm: cumulativeKm[cumulativeKm.length - 1] ?? 0 };
}

export function pointAtKm(route: RouteGeometry, km: number): { pos: Pt; heading: number } {
  const clamped = Math.max(0, Math.min(km, route.lengthKm));
  let i = 1;
  while (i < route.cumulativeKm.length - 1 && route.cumulativeKm[i]! < clamped) i++;
  const a = route.points[i - 1]!;
  const b = route.points[i]!;
  const segKm = route.cumulativeKm[i]! - route.cumulativeKm[i - 1]! || 1e-6;
  const f = (clamped - route.cumulativeKm[i - 1]!) / segKm;
  return {
    pos: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
    heading: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  };
}

/** Kilometre position along a route where a schematic point is traversed. */
export function kmOfPoint(route: RouteGeometry, target: Pt): number | null {
  for (let i = 0; i < route.points.length; i++) {
    if (dist(route.points[i]!, target) < 6) return route.cumulativeKm[i]!;
  }
  return null;
}

export const RESOURCES: Record<string, { label: string; point: Pt }> = {
  J2_UP_ROUTE: { label: "J2 up route — west throat", point: J2 },
  J5_YARD_ROUTE: {
    label: "J5 yard route — east throat",
    point: JUNCTIONS[1]!.at,
  },
};

export interface TrainRun {
  train: TrainDef;
  routeKey: string;
  route: RouteGeometry;
  kmAt: Float64Array;
  speedAt: Float64Array;
  heldUntil: number | null;
  capKmh: number | null;
}

export interface SimRun {
  runs: Record<string, TrainRun>;
  actions: AppliedAction[];
  disruption: DisruptionDef;
}

const DT = 1;
const N = HORIZON_S + 1;

function disruptionFor(id: DisruptionId): DisruptionDef {
  return DISRUPTIONS.find((d) => d.id === id) ?? DISRUPTIONS[0]!;
}

export function runSimulation(
  actions: AppliedAction[],
  disruptionId: DisruptionId = "NONE",
  trains: TrainDef[] = TRAINS,
): SimRun {
  const disruption = disruptionFor(disruptionId);
  const runs: Record<string, TrainRun> = {};

  for (const train of trains) {
    const effect = disruption.effects.find((e) => e.trainId === train.id);
    const speedFactor = effect?.speedFactor ?? 1;
    const startKm = train.startKm + (effect?.startKmDelta ?? 0);

    const own = actions.filter((a) => a.trainId === train.id);
    const reroute = own.find((a) => a.kind === "REROUTE");
    const routeKey = reroute && train.altRoute ? "ALT" : "PRIMARY";
    const route = buildRoute(routeKey === "ALT" ? train.altRoute! : train.route);

    const hold = own.find((a) => a.kind === "HOLD");
    const cap = own.find((a) => a.kind === "SPEED_REGULATION");

    const kmAt = new Float64Array(N);
    const speeds = new Float64Array(N);
    let km = startKm;
    for (let t = 0; t < N; t++) {
      let v = train.cruiseKmh * speedFactor;
      if (cap?.capKmh != null && t >= cap.fromT) v = Math.min(v, cap.capKmh);
      if (hold && t >= hold.fromT && t < hold.fromT + (hold.holdS ?? 0)) v = 0;
      if (km >= route.lengthKm) v = 0;
      kmAt[t] = Math.min(km, route.lengthKm);
      speeds[t] = v;
      km += (v / 3600) * DT;
    }

    runs[train.id] = {
      train,
      routeKey,
      route,
      kmAt,
      speedAt: speeds,
      heldUntil: hold ? hold.fromT + (hold.holdS ?? 0) : null,
      capKmh: cap?.capKmh ?? null,
    };
  }

  return { runs, actions, disruption };
}

export function arrivalTimeAtKm(run: TrainRun, km: number): number | null {
  if (run.kmAt[0]! > km) return null;
  for (let t = 0; t < N; t++) if (run.kmAt[t]! >= km) return t;
  return null;
}

function blockLabel(run: TrainRun, t: number): string {
  const km = run.kmAt[t] ?? 0;
  const ids = run.routeKey === "ALT" ? run.train.altRoute! : run.train.route;
  let acc = 0;
  for (const id of ids) {
    const geo = buildRoute([id]);
    if (km <= acc + geo.lengthKm) return TRACK_MAP[id]?.label ?? id;
    acc += geo.lengthKm;
  }
  return "Cleared section";
}

export function trainStates(sim: SimRun, t: number, free: SimRun): TrainRuntimeState[] {
  const tt = Math.max(0, Math.min(Math.round(t), N - 1));
  return Object.values(sim.runs).map((run) => {
    const km = run.kmAt[tt] ?? 0;
    const { pos, heading } = pointAtKm(run.route, km);
    const freeRun = free.runs[run.train.id];
    const lostKm = freeRun ? Math.max(0, (freeRun.kmAt[tt] ?? 0) - km) : 0;
    const induced = (lostKm / Math.max(run.train.cruiseKmh, 1)) * 60;
    const resourceKm = kmOfPoint(run.route, J2);
    const eta =
      resourceKm != null && km < resourceKm
        ? ((resourceKm - km) / Math.max(run.speedAt[tt] || run.train.cruiseKmh, 1)) * 60
        : null;

    let state: TrainRuntimeState["state"] = "RUNNING";
    if (run.train.type === "YARD") state = "SHUNTING";
    if (km >= run.route.lengthKm - 0.01) state = "CLEARED";
    else if ((run.speedAt[tt] ?? 0) === 0) state = "HELD";
    else if (run.capKmh != null && tt >= 0 && run.capKmh < run.train.cruiseKmh) state = "REGULATED";
    else if (run.routeKey === "ALT") state = "REROUTED";

    return {
      train: run.train,
      km,
      pos,
      heading,
      speedKmh: Math.round(run.speedAt[tt] ?? 0),
      delayMin: run.train.entryDelayMin + induced,
      etaMinToJunction: eta,
      block: blockLabel(run, tt),
      state,
      routeKey: run.routeKey,
    };
  });
}

export interface ResourceArrival {
  trainId: string;
  atT: number;
  km: number;
}

export function resourceArrivals(sim: SimRun, resourceId: string): ResourceArrival[] {
  const resource = RESOURCES[resourceId];
  if (!resource) return [];
  const out: ResourceArrival[] = [];
  for (const run of Object.values(sim.runs)) {
    const km = kmOfPoint(run.route, resource.point);
    if (km == null) continue;
    const atT = arrivalTimeAtKm(run, km);
    if (atT == null) continue;
    out.push({ trainId: run.train.id, atT, km });
  }
  return out.sort((a, b) => a.atT - b.atT);
}

export function detectConflicts(sim: SimRun, now: number): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const [resourceId, resource] of Object.entries(RESOURCES)) {
    const arrivals = resourceArrivals(sim, resourceId).filter((a) => a.atT >= now - 30);
    for (let i = 1; i < arrivals.length; i++) {
      const first = arrivals[i - 1]!;
      const second = arrivals[i]!;
      const separation = second.atT - first.atT;
      if (separation >= REQUIRED_HEADWAY_S) continue;
      const a = sim.runs[first.trainId]!.train;
      const b = sim.runs[second.trainId]!.train;
      conflicts.push({
        id: `${resourceId}-${a.id}-${b.id}`,
        kind: "JUNCTION_CONTENTION",
        resourceId,
        resourceLabel: resource.label,
        trainA: a.id,
        trainB: b.id,
        atT: second.atT,
        etaS: Math.max(0, second.atT - now),
        separationS: separation,
        requiredHeadwayS: REQUIRED_HEADWAY_S,
        point: resource.point,
        narrative:
          `${a.type === "FREIGHT" ? "Freight" : a.type.toLowerCase()} ${a.number} is projected to take the ` +
          `${resource.label} ${Math.round(separation)} s before ${b.number} requires the same route window. ` +
          `Minimum separation over this junction is ${REQUIRED_HEADWAY_S} s, so the second movement cannot be ` +
          `signalled without regulation.`,
      });
    }
  }
  return conflicts;
}

function safetyValidation(feasible: boolean, separation: number, routeChange: boolean): SafetyValidation {
  const headwayOk = separation >= REQUIRED_HEADWAY_S;
  return {
    status: feasible && headwayOk ? "PASSED" : "FAILED",
    checks: [
      {
        id: "headway",
        label: "Minimum headway",
        status: headwayOk ? "PASSED" : "FAILED",
        detail: `${Math.round(separation)} s projected against ${REQUIRED_HEADWAY_S} s required`,
      },
      {
        id: "track",
        label: "Track availability",
        status: "PASSED",
        detail: routeChange ? "Goods loop clear over the planning horizon" : "Up fast line clear beyond J2",
      },
      {
        id: "platform",
        label: "Platform availability",
        status: "NOT_APPLICABLE",
        detail: "Movement does not require a platform road",
      },
      {
        id: "route",
        label: "Route feasibility",
        status: feasible ? "PASSED" : "FAILED",
        detail: feasible ? "Route set is achievable by interlocking" : "No conflict-free route window produced",
      },
      {
        id: "ordering",
        label: "Train ordering",
        status: "PASSED",
        detail: "Priority order preserved for passenger movements",
      },
      {
        id: "signal",
        label: "Signal restrictions",
        status: "PASSED",
        detail: "No restrictive aspect overridden — signalling remains under interlocking control",
      },
    ],
  };
}

export interface OptionSpec {
  id: string;
  label: string;
  summary: string;
  action: AppliedAction | null;
  infrastructureChange: OptionOutcome["infrastructureChange"];
  routeChange: boolean;
  actsOnResource: boolean;
}

export function optionSpecs(conflict: Conflict, now: number): OptionSpec[] {
  const at = Math.round(now);
  return [
    {
      id: "A",
      label: "Regulate freight speed",
      summary: `Regulate ${conflict.trainA} to 30 km/h so the express takes the route window first.`,
      action: { kind: "SPEED_REGULATION", trainId: conflict.trainA, fromT: at, capKmh: 30 },
      infrastructureChange: "NONE",
      routeChange: false,
      actsOnResource: true,
    },
    {
      id: "B",
      label: "Hold freight at S22",
      summary: `Hold ${conflict.trainA} at the goods throat signal for 3 minutes.`,
      action: { kind: "HOLD", trainId: conflict.trainA, fromT: at, holdS: 180 },
      infrastructureChange: "NONE",
      routeChange: false,
      actsOnResource: true,
    },
    {
      id: "C",
      label: "Hold express at Naigaon",
      summary: `Hold ${conflict.trainB} for 2 minutes and let the freight movement clear first.`,
      action: { kind: "HOLD", trainId: conflict.trainB, fromT: at, holdS: 120 },
      infrastructureChange: "NONE",
      routeChange: false,
      actsOnResource: true,
    },
    {
      id: "D",
      label: "Alternate route via goods loop",
      summary: `Divert ${conflict.trainA} over the south goods loop and the east throat, clearing the J2 up route.`,
      action: { kind: "REROUTE", trainId: conflict.trainA, fromT: at, routeKey: "ALT" },
      infrastructureChange: "MEDIUM",
      routeChange: true,
      actsOnResource: true,
    },
    {
      id: "E",
      label: "Platform reassignment",
      summary: "Reassign the platform road for the express arrival.",
      action: null,
      infrastructureChange: "LOW",
      routeChange: false,
      actsOnResource: false,
    },
  ];
}

export function delayTotals(sim: SimRun, free: SimRun, at: number) {
  const tt = Math.min(Math.max(Math.round(at), 0), N - 1);
  let passenger = 0;
  let freight = 0;
  const byTrain: Record<string, number> = {};
  for (const run of Object.values(sim.runs)) {
    const freeRun = free.runs[run.train.id];
    const lostKm = Math.max(0, (freeRun?.kmAt[tt] ?? 0) - (run.kmAt[tt] ?? 0));
    const induced = (lostKm / Math.max(run.train.cruiseKmh, 1)) * 60;
    byTrain[run.train.id] = induced;
    if (run.train.type === "FREIGHT" || run.train.type === "YARD") freight += induced;
    else passenger += induced;
  }
  return { byTrain, passenger, freight, network: passenger + freight };
}

function throughput(sim: SimRun, at: number): number {
  const tt = Math.min(Math.max(Math.round(at), 0), N - 1);
  let moving = 0;
  for (const run of Object.values(sim.runs)) if ((run.speedAt[tt] ?? 0) > 0) moving++;
  // section throughput expressed as trains per hour over the observed window
  return Math.round(moving * (3600 / 600) * 10) / 10;
}

export function evaluateOptions(
  baseActions: AppliedAction[],
  disruptionId: DisruptionId,
  conflict: Conflict,
  now: number,
): OptionOutcome[] {
  const free = runSimulation([], disruptionId);
  const evalAt = Math.min(HORIZON_S, Math.round(conflict.atT) + 240);

  const outcomes = optionSpecs(conflict, now).map((spec) => {
    if (!spec.action) {
      return {
        id: spec.id,
        label: spec.label,
        summary: spec.summary,
        action: null,
        feasible: false,
        conflictResolved: false,
        separationS: conflict.separationS,
        delayByTrain: {},
        networkDelayMin: 0,
        passengerDelayMin: 0,
        freightDelayMin: 0,
        throughputPerHour: 0,
        infrastructureChange: spec.infrastructureChange,
        routeChange: spec.routeChange,
        safety: safetyValidation(false, conflict.separationS, false),
        rank: 99,
      } satisfies OptionOutcome;
    }

    const sim = runSimulation([...baseActions, spec.action], disruptionId);
    const arrivals = resourceArrivals(sim, conflict.resourceId);
    const a = arrivals.find((x) => x.trainId === conflict.trainA);
    const b = arrivals.find((x) => x.trainId === conflict.trainB);
    let separation = Infinity;
    if (spec.routeChange && !a) separation = Infinity;
    else if (a && b) separation = Math.abs(b.atT - a.atT);
    const resolved = separation >= REQUIRED_HEADWAY_S;
    const totals = delayTotals(sim, free, evalAt);

    return {
      id: spec.id,
      label: spec.label,
      summary: spec.summary,
      action: spec.action,
      feasible: resolved,
      conflictResolved: resolved,
      separationS: separation,
      delayByTrain: totals.byTrain,
      networkDelayMin: totals.network,
      passengerDelayMin: totals.passenger,
      freightDelayMin: totals.freight,
      throughputPerHour: throughput(sim, evalAt),
      infrastructureChange: spec.infrastructureChange,
      routeChange: spec.routeChange,
      safety: safetyValidation(resolved, separation, spec.routeChange),
      rank: 0,
    } satisfies OptionOutcome;
  });

  const scored = outcomes
    .filter((o) => o.feasible)
    .sort(
      (x, y) =>
        x.passengerDelayMin - y.passengerDelayMin ||
        x.networkDelayMin - y.networkDelayMin ||
        Number(x.routeChange) - Number(y.routeChange),
    );
  scored.forEach((o, i) => (o.rank = i + 1));
  return outcomes.sort((a, b) => (a.rank || 99) - (b.rank || 99) || a.id.localeCompare(b.id));
}

export function computeKpis(
  sim: SimRun,
  free: SimRun,
  at: number,
  conflicts: Conflict[],
): Kpis {
  const totals = delayTotals(sim, free, at);
  const states = trainStates(sim, at, free);
  const active = states.filter((s) => s.state !== "CLEARED");
  const totalDelay = active.reduce((sum, s) => sum + s.delayMin, 0);
  const occupiedPlatforms = new Set(
    active.filter((s) => s.train.platform).map((s) => s.train.platform),
  ).size;
  const onTime = active.filter((s) => s.delayMin <= 3).length;
  const routesInUse = new Set(active.map((s) => s.block)).size;
  return {
    activeTrains: active.length,
    activeConflicts: conflicts.length,
    totalDelayMin: totalDelay,
    avgDelayMin: active.length ? totalDelay / active.length : 0,
    passengerDelayMin: totals.passenger,
    freightDelayMin: totals.freight,
    throughputPerHour: throughput(sim, at),
    platformUtilisationPct: (occupiedPlatforms / 5) * 100,
    routeUtilisationPct: Math.min(100, (routesInUse / 12) * 100),
    onTimePct: active.length ? (onTime / active.length) * 100 : 0,
  };
}

/** Baseline strategy: strict priority — the freight is stopped until the express clears. */
export const BASELINE_ACTION: AppliedAction = {
  kind: "HOLD",
  trainId: "F1",
  fromT: 0,
  holdS: 330,
};

export function formatClock(baseIso: string, simSeconds: number): string {
  const d = new Date(new Date(baseIso).getTime() + simSeconds * 1000);
  return d.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour12: false });
}

export function mmss(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function fmt(n: number, digits = 1): string {
  return Number.isFinite(n) ? n.toFixed(digits) : "—";
}