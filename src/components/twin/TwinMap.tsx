import { useMemo, useState } from "react";

import {
  CORRIDOR_LABELS,
  JUNCTIONS,
  PLATFORMS,
  SIGNALS,
  STATION_LABELS,
  TRACKS,
  VIEW,
  X,
  Y,
} from "@/domain/topology";
import type { Pt, TrackDef } from "@/domain/types";
import { kmOfPoint, mmss, pointAtKm, segmentBetweenKm } from "@/sim/engine";
import { useTwin } from "@/sim/store";
import { TrainMarker, type MarkerTone } from "./TrainMarker";
import { Btn } from "@/components/ops/primitives";

const poly = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(" ");

const trackStyle = (track: TrackDef) => {
  switch (track.kind) {
    case "main-fast":
      return { stroke: "var(--track)", width: 3 };
    case "main-slow":
      return { stroke: "var(--track-slow)", width: 2.4 };
    case "goods":
      return { stroke: "var(--track-goods)", width: 2.4 };
    case "loop":
      return { stroke: "var(--track-slow)", width: 1.8 };
    default:
      return { stroke: "var(--track-slow)", width: 1.4 };
  }
};

/** Static direction indicators: no animation, orientation carries the meaning. */
function DirectionMarks({ track }: { track: TrackDef }) {
  const pts = track.points;
  const marks: { at: Pt; angle: number }[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    const step = 170;
    for (let d = step / 2; d < len; d += step) {
      const f = d / len;
      marks.push({ at: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }, angle });
    }
  }
  return (
    <g opacity={0.55}>
      {marks.map((m, i) => (
        <path
          key={i}
          d="M -3 -3 L 3 0 L -3 3"
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={1}
          transform={`translate(${m.at.x} ${m.at.y}) rotate(${m.angle})`}
        />
      ))}
    </g>
  );
}

export function TwinMap({ compact = false }: { compact?: boolean }) {
  const twin = useTwin();
  const [layers, setLayers] = useState({
    infrastructure: true,
    live: true,
    predicted: true,
    decision: true,
  });

  const conflict = twin.primaryConflict;
  const conflictIds = conflict ? [conflict.trainA, conflict.trainB] : [];
  const resolved = twin.decisionStatus === "ACCEPTED" || twin.decisionStatus === "MODIFIED";

  const projections = useMemo(() => {
    const horizon = 420;
    return twin.states
      .filter(
        (s) =>
          s.state !== "CLEARED" &&
          (conflictIds.includes(s.train.id) || twin.selectedTrainId === s.train.id),
      )
      .map((s) => {
        const run = twin.sim.runs[s.train.id]!;
        const endT = Math.min(twin.previewTime + horizon, run.kmAt.length - 1);
        const endKm = run.kmAt[Math.round(endT)] ?? s.km;
        return {
          id: s.train.id,
          tone: conflictIds.includes(s.train.id) ? "conflict" : "selected",
          points: segmentBetweenKm(run.route, s.km, endKm),
          head: pointAtKm(run.route, endKm).pos,
        };
      });
  }, [twin.states, twin.sim, twin.previewTime, twin.selectedTrainId, conflictIds]);

  const decisionPath = useMemo(() => {
    if (!resolved) return null;
    const actioned = twin.actions[twin.actions.length - 1];
    if (!actioned) return null;
    const run = twin.sim.runs[actioned.trainId];
    const state = twin.states.find((s) => s.train.id === actioned.trainId);
    if (!run || !state) return null;
    const endT = Math.min(twin.previewTime + 480, run.kmAt.length - 1);
    return {
      trainId: actioned.trainId,
      points: segmentBetweenKm(run.route, state.km, run.kmAt[Math.round(endT)] ?? state.km),
    };
  }, [resolved, twin.actions, twin.sim, twin.states, twin.previewTime]);

  const conflictMarkers = useMemo(() => {
    if (!conflict) return null;
    const a = twin.sim.runs[conflict.trainA];
    if (!a) return null;
    const km = kmOfPoint(a.route, conflict.point);
    return { point: conflict.point, km };
  }, [conflict, twin.sim]);

  return (
    <div className="relative flex max-h-[70vh] min-h-0 flex-1 flex-col bg-map">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-1.5">
        <span className="label-xs">Layers</span>
        {(
          [
            ["infrastructure", "Infrastructure"],
            ["live", "Live state"],
            ["predicted", "Predicted"],
            ["decision", "Decision"],
          ] as const
        ).map(([key, label]) => (
          <Btn
            key={key}
            active={layers[key]}
            onClick={() => setLayers((l) => ({ ...l, [key]: !l[key] }))}
          >
            {label}
          </Btn>
        ))}
        <div className="ml-auto flex items-center gap-4">
          <LegendKey swatch="var(--track)" text="Current / actual" solid />
          <LegendKey swatch="var(--state-conflict)" text="Projected path" />
          <LegendKey swatch="var(--state-ok)" text="Recommended" />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className={compact ? "h-full w-full" : "mx-auto min-h-0 w-full flex-1 self-center"}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Vasai Road Junction operational diagram"
      >
        <defs>
          <pattern id="hazard" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="8" stroke="var(--state-conflict)" strokeWidth="2.4" opacity="0.5" />
          </pattern>
        </defs>

        {layers.infrastructure ? (
          <g>
            {/* Station limit */}
            <rect
              x={X.staWest - 20}
              y={200}
              width={X.staEast - X.staWest + 40}
              height={296}
              fill="color-mix(in oklab, var(--map-grid) 60%, var(--map))"
              stroke="var(--line)"
            />
            <rect
              x={1150}
              y={110}
              width={340}
              height={110}
              fill="color-mix(in oklab, var(--map-grid) 40%, var(--map))"
              stroke="var(--line)"
              strokeDasharray="3 3"
            />

            {TRACKS.map((track) => {
              const s = trackStyle(track);
              return (
                <g key={track.id}>
                  <polyline
                    points={poly(track.points)}
                    fill="none"
                    stroke={s.stroke}
                    strokeWidth={s.width}
                    strokeLinecap="square"
                  />
                  <DirectionMarks track={track} />
                </g>
              );
            })}

            {PLATFORMS.map((p) => (
              <g key={p.id}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  fill="var(--raised)"
                  stroke="var(--line-strong)"
                />
                <text
                  x={p.x + 8}
                  y={p.y + p.height - 4}
                  fill="var(--ink-faint)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em" }}
                >
                  PF {p.number}
                </text>
              </g>
            ))}

            {SIGNALS.map((sig) => (
              <g key={sig.id} transform={`translate(${sig.at.x} ${sig.at.y})`}>
                <line x1={0} y1={0} x2={0} y2={-14} stroke="var(--line-strong)" strokeWidth={1} />
                <circle
                  cx={0}
                  cy={-18}
                  r={3.4}
                  fill={
                    sig.aspect === "GREEN"
                      ? "var(--state-ok)"
                      : sig.aspect === "AMBER"
                        ? "var(--state-warning)"
                        : "var(--state-conflict)"
                  }
                />
                <text
                  x={6}
                  y={-15}
                  fill="var(--ink-faint)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 8 }}
                >
                  {sig.id}
                </text>
              </g>
            ))}

            {JUNCTIONS.map((j) => (
              <g key={j.id} transform={`translate(${j.at.x} ${j.at.y})`}>
                <rect
                  x={-5}
                  y={-5}
                  width={10}
                  height={10}
                  transform="rotate(45)"
                  fill="var(--map)"
                  stroke="var(--line-strong)"
                  strokeWidth={1.2}
                />
                <text
                  x={0}
                  y={-14}
                  textAnchor="middle"
                  fill="var(--ink-dim)"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em" }}
                >
                  {j.id}
                </text>
              </g>
            ))}

            {STATION_LABELS.map((s) => (
              <text
                key={s.id}
                x={s.at.x}
                y={s.at.y}
                textAnchor={s.anchor ?? "middle"}
                fill={s.id === "vasai" ? "var(--ink)" : "var(--ink-faint)"}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: s.id === "vasai" ? 13 : 9.5,
                  letterSpacing: "0.14em",
                }}
              >
                {s.name}
              </text>
            ))}

            {CORRIDOR_LABELS.map((c) => (
              <text
                key={c.id}
                x={c.at.x}
                y={c.at.y}
                textAnchor={c.anchor}
                fill="var(--ink-faint)"
                style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.14em" }}
              >
                {c.text}
              </text>
            ))}

            <text
              x={X.west}
              y={Y.upFast - 26}
              fill="var(--ink-faint)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em" }}
            >
              UP FAST →
            </text>
            <text
              x={X.west}
              y={Y.dnFast + 24}
              fill="var(--ink-faint)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em" }}
            >
              ← DN FAST
            </text>
          </g>
        ) : null}

        {/* Predicted state */}
        {layers.predicted
          ? projections.map((p) => (
              <g key={p.id}>
                <polyline
                  points={poly(p.points)}
                  fill="none"
                  stroke={p.tone === "conflict" ? "var(--state-conflict)" : "var(--state-selected)"}
                  strokeWidth={2}
                  strokeDasharray="7 6"
                  opacity={0.85}
                />
                <circle
                  cx={p.head.x}
                  cy={p.head.y}
                  r={3}
                  fill="none"
                  stroke={p.tone === "conflict" ? "var(--state-conflict)" : "var(--state-selected)"}
                  strokeWidth={1.2}
                />
              </g>
            ))
          : null}

        {/* Decision state */}
        {layers.decision && decisionPath ? (
          <polyline
            points={poly(decisionPath.points)}
            fill="none"
            stroke="var(--state-ok)"
            strokeWidth={2.4}
            strokeDasharray="14 5"
            opacity={0.9}
          />
        ) : null}

        {/* Conflict zone */}
        {conflict && layers.predicted ? (
          <g transform={`translate(${conflictMarkers?.point.x ?? 0} ${conflictMarkers?.point.y ?? 0})`}>
            <rect
              x={-30}
              y={-30}
              width={60}
              height={60}
              fill={resolved ? "none" : "url(#hazard)"}
              stroke={resolved ? "var(--state-ok)" : "var(--state-conflict)"}
              strokeWidth={1.3}
              className={resolved ? undefined : "conflict-pulse"}
            />
            <text
              x={0}
              y={-40}
              textAnchor="middle"
              fill={resolved ? "var(--state-ok)" : "var(--state-conflict)"}
              style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em" }}
            >
              {resolved ? "ROUTE WINDOW CLEARED" : "PREDICTED ROUTE CONFLICT"}
            </text>
            <text
              x={0}
              y={-28}
              textAnchor="middle"
              fill="var(--ink-dim)"
              style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
            >
              {conflict.trainA} + {conflict.trainB} · {mmss(conflict.etaS)}
            </text>
          </g>
        ) : null}

        {/* Live state */}
        {layers.live
          ? twin.states
              .filter((s) => s.state !== "CLEARED")
              .map((s) => {
                let tone: MarkerTone = s.train.type === "FREIGHT" ? "freight" : "neutral";
                if (conflictIds.includes(s.train.id)) tone = resolved ? "resolved" : "conflict";
                if (twin.selectedTrainId === s.train.id) tone = "selected";
                return (
                  <TrainMarker
                    key={s.train.id}
                    state={s}
                    tone={tone}
                    onSelect={twin.selectTrain}
                    showLabel={!compact}
                  />
                );
              })
          : null}
      </svg>

      {twin.isPreviewing ? (
        <div className="num pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 border border-selected/60 bg-map/90 px-3 py-1 text-[11px] tracking-wider text-selected uppercase">
          Future state preview · T+{mmss(twin.scrubOffset)}
        </div>
      ) : null}
    </div>
  );
}

function LegendKey({ swatch, text, solid }: { swatch: string; text: string; solid?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="22" height="6" aria-hidden>
        <line
          x1="0"
          y1="3"
          x2="22"
          y2="3"
          stroke={swatch}
          strokeWidth="2"
          strokeDasharray={solid ? undefined : "5 4"}
        />
      </svg>
      <span className="label-xs">{text}</span>
    </span>
  );
}