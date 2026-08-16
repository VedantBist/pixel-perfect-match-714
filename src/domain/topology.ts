import type {
  JunctionDef,
  PlatformDef,
  Pt,
  SignalDef,
  StationLabel,
  TrackDef,
  TrackId,
} from "./types";

/** Schematic canvas. Not geographic: this is an operational railway diagram. */
export const VIEW = { width: 1600, height: 830 };

/** Diagram scale: schematic pixels to route kilometres. */
export const KM_PER_PX = 0.055;

export const Y = {
  yardB: 140,
  yardA: 176,
  upFast: 250,
  dnFast: 296,
  upSlow: 372,
  dnSlow: 418,
  goods: 470,
  loop: 600,
} as const;

export const X = { west: 30, staWest: 560, staEast: 1080, east: 1570 } as const;

export const J2: Pt = { x: 505, y: Y.upFast };

const t = (
  id: string,
  label: string,
  kind: TrackDef["kind"],
  direction: TrackDef["direction"],
  points: Pt[],
): TrackDef => ({ id, label, kind, direction, points });

export const TRACKS: TrackDef[] = [
  // Western corridor — UP (towards Virar / Surat)
  t("MUM_UP_APP", "UP Fast — Naigaon approach", "main-fast", "UP", [
    { x: X.west, y: Y.upFast },
    { x: X.staWest, y: Y.upFast },
  ]),
  t("STA_UP", "UP Fast — Vasai Road through", "main-fast", "UP", [
    { x: X.staWest, y: Y.upFast },
    { x: X.staEast, y: Y.upFast },
  ]),
  t("NORTH_UP", "UP Fast — Nalla Sopara / Virar", "main-fast", "UP", [
    { x: X.staEast, y: Y.upFast },
    { x: X.east, y: Y.upFast },
  ]),
  // Western corridor — DOWN (towards Mumbai)
  t("NORTH_DN", "DN Fast — Virar approach", "main-fast", "DOWN", [
    { x: X.east, y: Y.dnFast },
    { x: X.staEast, y: Y.dnFast },
  ]),
  t("STA_DN", "DN Fast — Vasai Road through", "main-fast", "DOWN", [
    { x: X.staEast, y: Y.dnFast },
    { x: X.staWest, y: Y.dnFast },
  ]),
  t("MUM_DN_APP", "DN Fast — Naigaon departure", "main-fast", "DOWN", [
    { x: X.staWest, y: Y.dnFast },
    { x: X.west, y: Y.dnFast },
  ]),
  // Slow lines
  t("MUM_UP_SLOW", "UP Slow — Naigaon approach", "main-slow", "UP", [
    { x: X.west, y: Y.upSlow },
    { x: X.staWest, y: Y.upSlow },
  ]),
  t("STA_UP_SLOW", "UP Slow — Platform 3", "main-slow", "UP", [
    { x: X.staWest, y: Y.upSlow },
    { x: X.staEast, y: Y.upSlow },
  ]),
  t("NORTH_UP_SLOW", "UP Slow — Nalla Sopara", "main-slow", "UP", [
    { x: X.staEast, y: Y.upSlow },
    { x: X.east, y: Y.upSlow },
  ]),
  t("NORTH_DN_SLOW", "DN Slow — Virar approach", "main-slow", "DOWN", [
    { x: X.east, y: Y.dnSlow },
    { x: X.staEast, y: Y.dnSlow },
  ]),
  t("STA_DN_SLOW", "DN Slow — Platform 5", "main-slow", "DOWN", [
    { x: X.staEast, y: Y.dnSlow },
    { x: X.staWest, y: Y.dnSlow },
  ]),
  t("MUM_DN_SLOW", "DN Slow — Naigaon departure", "main-slow", "DOWN", [
    { x: X.staWest, y: Y.dnSlow },
    { x: X.west, y: Y.dnSlow },
  ]),
  // Diva / Bhiwandi goods corridor — inbound to Vasai
  t("GOODS_IN_LOWER", "Goods UP — Bhiwandi / Juchandra", "goods", "UP", [
    { x: X.west, y: 745 },
    { x: 300, y: 745 },
    { x: 400, y: 700 },
    { x: 452, y: 560 },
  ]),
  t("GOODS_THROAT", "Goods UP — Vasai west throat", "goods", "UP", [
    { x: 452, y: 560 },
    { x: 478, y: 340 },
    { x: J2.x, y: J2.y },
  ]),
  t("J2_LINK", "J2 crossover — UP Fast", "loop", "UP", [
    { x: J2.x, y: J2.y },
    { x: X.staWest, y: Y.upFast },
  ]),
  // Goods outbound towards Diva
  t("GOODS_OUT_STA", "Goods DN — Vasai goods lines", "goods", "DOWN", [
    { x: X.staEast, y: Y.goods },
    { x: 700, y: Y.goods },
    { x: 600, y: 478 },
    { x: 520, y: 505 },
  ]),
  t("GOODS_OUT_LOWER", "Goods DN — Kaman Road / Diva", "goods", "DOWN", [
    { x: 520, y: 505 },
    { x: 470, y: 585 },
    { x: 420, y: 690 },
    { x: 330, y: 775 },
    { x: X.west, y: 775 },
  ]),
  // Alternate freight route: goods loop bypassing the J2 up route
  t("GOODS_LOOP", "Goods loop — south avoiding line", "loop", "UP", [
    { x: 452, y: 560 },
    { x: 520, y: Y.loop },
    { x: 760, y: Y.loop },
    { x: 1000, y: Y.loop },
    { x: 1080, y: 540 },
    { x: 1120, y: Y.goods },
  ]),
  t("NORTH_LINK", "Goods link — Vasai east throat", "loop", "UP", [
    { x: 1120, y: Y.goods },
    { x: 1320, y: Y.goods },
    { x: 1430, y: 420 },
    { x: 1490, y: Y.upSlow },
  ]),
  t("NORTH_UP_SLOW_EAST", "UP Slow — Virar", "main-slow", "UP", [
    { x: 1490, y: Y.upSlow },
    { x: X.east, y: Y.upSlow },
  ]),
  // North yard / sidings (Vasai – Virar side)
  t("YARD_A", "North yard — siding A", "yard", "YARD", [
    { x: 1120, y: Y.upFast },
    { x: 1190, y: 205 },
    { x: 1260, y: Y.yardA },
    { x: 1470, y: Y.yardA },
  ]),
  t("YARD_B", "North yard — siding B", "yard", "YARD", [
    { x: 1215, y: 200 },
    { x: 1280, y: Y.yardB },
    { x: 1470, y: Y.yardB },
  ]),
];

export const TRACK_MAP: Record<TrackId, TrackDef> = Object.fromEntries(
  TRACKS.map((tr) => [tr.id, tr]),
);

export const PLATFORMS: PlatformDef[] = [
  { id: "PF1", number: "1", x: 600, y: 224, width: 420, height: 14 },
  { id: "PF2", number: "2 / 3", x: 600, y: 316, width: 420, height: 18 },
  { id: "PF4", number: "4 / 5", x: 600, y: 438, width: 420, height: 18 },
];

export const JUNCTIONS: JunctionDef[] = [
  { id: "J2", label: "J2 — West throat", at: J2, resource: "J2_UP_ROUTE" },
  {
    id: "J5",
    label: "J5 — East throat",
    at: { x: 1120, y: Y.upFast },
    resource: "J5_YARD_ROUTE",
  },
];

export const SIGNALS: SignalDef[] = [
  { id: "S21", at: { x: 452, y: Y.upFast }, aspect: "GREEN", facing: 1 },
  { id: "S22", at: { x: 470, y: 400 }, aspect: "AMBER", facing: 1 },
  { id: "S24", at: { x: 1060, y: Y.upFast }, aspect: "GREEN", facing: 1 },
  { id: "S31", at: { x: 590, y: Y.dnFast }, aspect: "GREEN", facing: -1 },
  { id: "S33", at: { x: 1050, y: Y.dnSlow }, aspect: "AMBER", facing: -1 },
  { id: "S41", at: { x: 700, y: Y.goods }, aspect: "RED", facing: -1 },
];

export const STATION_LABELS: StationLabel[] = [
  { id: "vasai", name: "VASAI ROAD JN", at: { x: 810, y: 196 }, corridor: "" },
  {
    id: "naigaon",
    name: "NAIGAON",
    at: { x: 120, y: 226 },
    corridor: "MUMBAI",
    anchor: "start",
  },
  {
    id: "nallasopara",
    name: "NALLA SOPARA",
    at: { x: 1240, y: 226 },
    corridor: "NORTH",
    anchor: "start",
  },
  {
    id: "virar",
    name: "VIRAR",
    at: { x: 1470, y: 226 },
    corridor: "NORTH",
    anchor: "start",
  },
  {
    id: "juchandra",
    name: "JUCHANDRA",
    at: { x: 316, y: 728 },
    corridor: "DIVA",
    anchor: "start",
  },
  {
    id: "kaman",
    name: "KAMAN ROAD",
    at: { x: 120, y: 728 },
    corridor: "DIVA",
    anchor: "start",
  },
];

export const CORRIDOR_LABELS = [
  { id: "c1", text: "MUMBAI / CHURCHGATE", at: { x: X.west, y: 465 }, anchor: "start" as const },
  { id: "c2", text: "NALLA SOPARA / VIRAR / SURAT", at: { x: X.east, y: 465 }, anchor: "end" as const },
  { id: "c3", text: "BHIWANDI RD / KOPAR / DIVA / PANVEL", at: { x: X.west, y: 806 }, anchor: "start" as const },
  { id: "c4", text: "NORTH YARD / SIDINGS", at: { x: 1470, y: 116 }, anchor: "end" as const },
  { id: "c5", text: "GOODS RECEPTION — DIVA SIDE", at: { x: 1080, y: 498 }, anchor: "end" as const },
];