import type { TrainRuntimeState } from "@/domain/types";

export type MarkerTone = "neutral" | "freight" | "conflict" | "selected" | "resolved";

const TONE: Record<MarkerTone, { fill: string; stroke: string; text: string }> = {
  neutral: { fill: "var(--raised)", stroke: "var(--state-normal)", text: "var(--ink)" },
  freight: { fill: "var(--raised)", stroke: "var(--state-freight)", text: "var(--ink)" },
  conflict: { fill: "color-mix(in oklab, var(--state-conflict) 26%, var(--map))", stroke: "var(--state-conflict)", text: "var(--ink)" },
  selected: { fill: "color-mix(in oklab, var(--state-selected) 22%, var(--map))", stroke: "var(--state-selected)", text: "var(--ink)" },
  resolved: { fill: "color-mix(in oklab, var(--state-ok) 18%, var(--map))", stroke: "var(--state-ok)", text: "var(--ink)" },
};

/**
 * Engineering train representation: an oriented body with a leading nose in the
 * direction of travel, sized by train type. Never a generic map pin.
 */
export function TrainMarker({
  state,
  tone,
  onSelect,
  showLabel = true,
}: {
  state: TrainRuntimeState;
  tone: MarkerTone;
  onSelect?: (id: string) => void;
  showLabel?: boolean;
}) {
  const t = TONE[tone];
  const length = state.train.type === "FREIGHT" ? 38 : state.train.type === "YARD" ? 16 : 28;
  const height = state.train.type === "YARD" ? 8 : 10;
  const nose = 7;
  const flip = Math.abs(state.heading) > 90 ? -1 : 1;

  return (
    <g
      transform={`translate(${state.pos.x} ${state.pos.y}) rotate(${state.heading})`}
      onClick={() => onSelect?.(state.train.id)}
      style={{ cursor: onSelect ? "pointer" : "default" }}
      tabIndex={onSelect ? 0 : -1}
      role={onSelect ? "button" : undefined}
      aria-label={`${state.train.number} ${state.train.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.(state.train.id);
      }}
    >
      <path
        d={`M ${-length} ${-height / 2} H ${length - nose} L ${length} 0 L ${length - nose} ${height / 2} H ${-length} Z`}
        fill={t.fill}
        stroke={t.stroke}
        strokeWidth={1.4}
      />
      {/* Consist separations — reads as a rake, not an icon */}
      {state.train.type === "FREIGHT" ? (
        <>
          <line x1={-length / 3} x2={-length / 3} y1={-height / 2} y2={height / 2} stroke={t.stroke} strokeWidth={0.8} opacity={0.7} />
          <line x1={length / 3} x2={length / 3} y1={-height / 2} y2={height / 2} stroke={t.stroke} strokeWidth={0.8} opacity={0.7} />
        </>
      ) : (
        <line x1={0} x2={0} y1={-height / 2} y2={height / 2} stroke={t.stroke} strokeWidth={0.8} opacity={0.6} />
      )}
      {showLabel ? (
        <g transform={`rotate(${flip === 1 ? -state.heading : 180 - state.heading})`}>
          <text
            x={0}
            y={-height - 5}
            textAnchor="middle"
            fill={t.text}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.04em",
            }}
          >
            {state.train.id} · {state.train.number}
          </text>
          <text
            x={0}
            y={height + 12}
            textAnchor="middle"
            fill="var(--ink-faint)"
            style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
          >
            {state.speedKmh} km/h
          </text>
        </g>
      ) : null}
    </g>
  );
}