import type { DisruptionId, TrainDef } from "./types";

/**
 * Deterministic presentation scenario. This is SYNTHETIC operational data
 * used for demonstration — it is never presented as live railway data.
 */
export const SCENARIO_START_ISO = "2026-03-14T22:12:00+05:30";

/** Minimum headway enforced over a constrained junction route, seconds. */
export const REQUIRED_HEADWAY_S = 90;

/** Prediction horizon, seconds. */
export const HORIZON_S = 900;

export const TRAINS: TrainDef[] = [
  {
    id: "E1",
    number: "12933",
    name: "Karnavati Express",
    type: "EXPRESS",
    direction: "UP",
    priority: 1,
    origin: "Mumbai Central",
    destination: "Ahmedabad Jn",
    route: ["MUM_UP_APP", "STA_UP", "NORTH_UP"],
    startKm: 16.7,
    cruiseKmh: 78,
    entryDelayMin: 2.4,
    passengerLoad: 1320,
  },
  {
    id: "F1",
    number: "GDS 4172",
    name: "Container rake — Diva",
    type: "FREIGHT",
    direction: "UP",
    priority: 4,
    origin: "Diva Jn",
    destination: "Virar North Yard",
    route: ["GOODS_IN_LOWER", "GOODS_THROAT", "J2_LINK", "STA_UP", "NORTH_UP"],
    altRoute: ["GOODS_IN_LOWER", "GOODS_LOOP", "NORTH_LINK", "NORTH_UP_SLOW_EAST"],
    altRouteLabel: "Goods loop via east throat",
    startKm: 42.0,
    cruiseKmh: 42,
    entryDelayMin: 11.5,
  },
  {
    id: "E2",
    number: "12902",
    name: "Gujarat Mail",
    type: "EXPRESS",
    direction: "DOWN",
    priority: 1,
    origin: "Ahmedabad Jn",
    destination: "Mumbai Central",
    route: ["NORTH_DN", "STA_DN", "MUM_DN_APP"],
    startKm: 9.5,
    cruiseKmh: 88,
    entryDelayMin: 0.6,
    passengerLoad: 1180,
  },
  {
    id: "L1",
    number: "97032",
    name: "Churchgate — Virar Local",
    type: "LOCAL",
    direction: "UP",
    priority: 2,
    origin: "Churchgate",
    destination: "Virar",
    route: ["MUM_UP_SLOW", "STA_UP_SLOW", "NORTH_UP_SLOW"],
    startKm: 13.4,
    cruiseKmh: 62,
    entryDelayMin: 1.2,
    platform: "3",
    passengerLoad: 2400,
  },
  {
    id: "L2",
    number: "97117",
    name: "Virar — Churchgate Local",
    type: "LOCAL",
    direction: "DOWN",
    priority: 2,
    origin: "Virar",
    destination: "Churchgate",
    route: ["NORTH_DN_SLOW", "STA_DN_SLOW", "MUM_DN_SLOW"],
    startKm: 6.2,
    cruiseKmh: 58,
    entryDelayMin: 3.1,
    platform: "5",
    passengerLoad: 2210,
  },
  {
    id: "P1",
    number: "59440",
    name: "Vasai Rd — Bhiwandi Passenger",
    type: "PASSENGER",
    direction: "DOWN",
    priority: 3,
    origin: "Vasai Road",
    destination: "Diva Jn",
    route: ["GOODS_OUT_STA", "GOODS_OUT_LOWER"],
    startKm: 2.4,
    cruiseKmh: 46,
    entryDelayMin: 0.0,
    passengerLoad: 640,
  },
  {
    id: "F2",
    number: "GDS 5518",
    name: "Tank rake — Kopar",
    type: "FREIGHT",
    direction: "DOWN",
    priority: 4,
    origin: "Vasai Goods Reception",
    destination: "Kopar",
    route: ["GOODS_OUT_STA", "GOODS_OUT_LOWER"],
    startKm: 14.8,
    cruiseKmh: 34,
    entryDelayMin: 5.4,
  },
  {
    id: "Y1",
    number: "SHU 07",
    name: "North yard shunter",
    type: "YARD",
    direction: "YARD",
    priority: 5,
    origin: "North Yard",
    destination: "Siding A",
    route: ["YARD_A"],
    startKm: 2.1,
    cruiseKmh: 14,
    entryDelayMin: 0,
  },
  {
    id: "E3",
    number: "19015",
    name: "Saurashtra Express",
    type: "EXPRESS",
    direction: "UP",
    priority: 2,
    origin: "Dadar",
    destination: "Porbandar",
    route: ["MUM_UP_APP", "STA_UP", "NORTH_UP"],
    startKm: 3.6,
    cruiseKmh: 72,
    entryDelayMin: 0.8,
    passengerLoad: 1090,
  },
];

export interface DisruptionDef {
  id: DisruptionId;
  label: string;
  description: string;
  /** per-train multiplier / offset overrides applied to the base scenario */
  effects: { trainId: string; startKmDelta?: number; speedFactor?: number }[];
  note?: string;
}

export const DISRUPTIONS: DisruptionDef[] = [
  {
    id: "NONE",
    label: "Baseline scenario",
    description:
      "Deterministic evening peak state at Vasai Road Jn. Freight GDS 4172 from the Diva corridor and Karnavati Express from Naigaon both require the J2 up route window.",
    effects: [],
  },
  {
    id: "FREIGHT_LATE",
    label: "Freight running late",
    description:
      "GDS 4172 loses further time on the Bhiwandi section, moving its throat arrival deeper into the Express window.",
    effects: [{ trainId: "F1", startKmDelta: -1.1, speedFactor: 0.88 }],
  },
  {
    id: "PLATFORM_UNAVAILABLE",
    label: "Platform 5 unavailable",
    description:
      "Platform 5 is withdrawn for maintenance. Down slow arrivals must share Platform 2/3, tightening the station throat.",
    effects: [{ trainId: "L2", speedFactor: 0.82 }],
    note: "PF5 withdrawn",
  },
  {
    id: "SIGNAL_FAILURE",
    label: "S22 signal failure",
    description:
      "Goods throat signal S22 is under manual authorisation. Freight approach speed is restricted, extending occupation of the throat.",
    effects: [{ trainId: "F1", speedFactor: 0.7 }],
    note: "S22 manual authorisation",
  },
  {
    id: "PEAK_TRAFFIC",
    label: "Peak traffic surge",
    description:
      "Additional local services close up on the slow lines while the freight movement still requires the up route.",
    effects: [
      { trainId: "L1", startKmDelta: 2.4 },
      { trainId: "E3", startKmDelta: 3.0 },
      { trainId: "F1", speedFactor: 0.94 },
    ],
  },
];