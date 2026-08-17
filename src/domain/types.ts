export type TrainType = "EXPRESS" | "PASSENGER" | "LOCAL" | "FREIGHT" | "YARD";
export type Direction = "UP" | "DOWN" | "YARD";

export type Pt = { x: number; y: number };

export type TrackId = string;

export interface TrackDef {
  id: TrackId;
  label: string;
  kind: "main-fast" | "main-slow" | "goods" | "yard" | "loop";
  direction: Direction;
  points: Pt[];
}

export interface PlatformDef {
  id: string;
  number: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignalDef {
  id: string;
  at: Pt;
  aspect: "GREEN" | "AMBER" | "RED";
  facing: 1 | -1;
}

export interface JunctionDef {
  id: string;
  label: string;
  at: Pt;
  /** identifier of the constrained route window this junction controls */
  resource: string;
}

export interface StationLabel {
  id: string;
  name: string;
  at: Pt;
  corridor: string;
  anchor?: "start" | "middle" | "end";
}

export interface BlockDef {
  id: string;
  trackId: TrackId;
  fromKm: number;
  toKm: number;
  label: string;
}

export type ActionKind = "SPEED_REGULATION" | "HOLD" | "REROUTE";

export interface AppliedAction {
  kind: ActionKind;
  trainId: string;
  /** simulation seconds at which the action takes effect */
  fromT: number;
  /** SPEED_REGULATION: capped speed in km/h */
  capKmh?: number;
  /** SPEED_REGULATION: simulation seconds at which the restriction is lifted */
  untilT?: number;
  /** HOLD: duration in seconds */
  holdS?: number;
  /** REROUTE: alternate path key on the train */
  routeKey?: string;
}

export interface TrainDef {
  id: string;
  number: string;
  name: string;
  type: TrainType;
  direction: Direction;
  priority: number;
  origin: string;
  destination: string;
  /** primary route: ordered track ids stitched into one polyline */
  route: TrackId[];
  /** alternate feasible route, used by REROUTE actions */
  altRoute?: TrackId[];
  altRouteLabel?: string;
  /** distance along route in km at simulation t = 0 */
  startKm: number;
  cruiseKmh: number;
  /** scheduled delay already accumulated, minutes */
  entryDelayMin: number;
  /** platform assigned at Vasai Road, if any */
  platform?: string;
  passengerLoad?: number;
}

export type ConflictKind =
  | "JUNCTION_CONTENTION"
  | "ROUTE_CONFLICT"
  | "PLATFORM_OVERLAP"
  | "HEADWAY_RISK"
  | "BLOCK_OCCUPANCY";

export interface Conflict {
  id: string;
  kind: ConflictKind;
  resourceId: string;
  resourceLabel: string;
  trainA: string;
  trainB: string;
  /** simulation seconds at which contention materialises */
  atT: number;
  /** seconds until contention, relative to the observation time */
  etaS: number;
  /** projected separation at the resource, seconds */
  separationS: number;
  requiredHeadwayS: number;
  point: Pt;
  narrative: string;
}

export interface TrainRuntimeState {
  train: TrainDef;
  km: number;
  pos: Pt;
  heading: number;
  speedKmh: number;
  delayMin: number;
  etaMinToJunction: number | null;
  block: string;
  state: "RUNNING" | "REGULATED" | "HELD" | "REROUTED" | "SHUNTING" | "CLEARED";
  routeKey: string;
}

export interface OptionOutcome {
  id: string;
  label: string;
  summary: string;
  action: AppliedAction | null;
  feasible: boolean;
  conflictResolved: boolean;
  separationS: number;
  delayByTrain: Record<string, number>;
  networkDelayMin: number;
  passengerDelayMin: number;
  freightDelayMin: number;
  throughputPerHour: number;
  infrastructureChange: "NONE" | "LOW" | "MEDIUM";
  routeChange: boolean;
  safety: SafetyValidation;
  rank: number;
}

export interface SafetyCheck {
  id: string;
  label: string;
  status: "PASSED" | "FAILED" | "NOT_APPLICABLE";
  detail: string;
}

export interface SafetyValidation {
  status: "PASSED" | "FAILED";
  checks: SafetyCheck[];
}

export interface Kpis {
  activeTrains: number;
  activeConflicts: number;
  totalDelayMin: number;
  avgDelayMin: number;
  passengerDelayMin: number;
  freightDelayMin: number;
  throughputPerHour: number;
  platformUtilisationPct: number;
  routeUtilisationPct: number;
  onTimePct: number;
}

export interface DecisionLogEntry {
  id: string;
  atT: number;
  kind: "PREDICTION" | "ALTERNATIVES" | "VALIDATION" | "RECOMMENDATION" | "DECISION" | "STATE";
  text: string;
  detail?: string | undefined;
}

export type DisruptionId =
  | "NONE"
  | "FREIGHT_LATE"
  | "PLATFORM_UNAVAILABLE"
  | "SIGNAL_FAILURE"
  | "PEAK_TRAFFIC";