import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp, colors, fontFamily } from "../theme";

type KeysProps = {
  /** Key labels, pressed together, e.g. ["Ctrl", "Alt", "N"]. */
  readonly keys: readonly string[];
  /** Frame the combination is pressed. The caps appear a little before it. */
  readonly at: number;
  /** Frame the caps fade out; default: 1.6 s after `at`. */
  readonly until?: number;
  /** Height of a key cap in px. */
  readonly size: number;
  /** Small line under the caps, e.g. the macOS equivalent. */
  readonly note?: string;
  readonly dark?: boolean;
  readonly style?: React.CSSProperties;
};

/** A keyboard shortcut drawn as key caps that go down together, like the app's <kbd> hints. */
export const Keys: React.FC<KeysProps> = ({ keys, at, until, size, note, dark = false, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const end = until ?? at + 1.6 * fps;
  const appear = interpolate(frame, [at - 0.35 * fps, at - 0.1 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const leave = interpolate(frame, [end, end + 0.3 * fps], [1, 0], clamp);
  // Down for 0.25 s from `at`; the cap travels a fifth of its edge.
  const press = interpolate(frame, [at, at + 2, at + 0.25 * fps, at + 0.25 * fps + 3], [0, 1, 1, 0], clamp);
  const edge = size * 0.1;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: size * 0.28,
        fontFamily,
        opacity: appear * leave,
        translate: `0px ${(1 - appear) * size * 0.3}px`,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: size * 0.22 }}>
        {keys.map((key, i) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: size * 0.22 }}>
            {i > 0 ? (
              <div style={{ fontSize: size * 0.42, fontWeight: 700, color: dark ? colors.terminal : colors.muted }}>+</div>
            ) : null}
            <div
              style={{
                minWidth: size,
                height: size,
                padding: `0 ${size * 0.26}px`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: size * 0.16,
                backgroundColor: colors.sheet,
                border: `${Math.max(1.5, size * 0.025)}px solid ${colors.line}`,
                boxShadow: `0 ${edge * (1 - press * 0.7)}px 0 ${colors.line}, 0 ${edge * 1.4}px ${size * 0.3}px rgba(35, 38, 43, ${0.18 - press * 0.08})`,
                translate: `0px ${press * edge * 0.7}px`,
                fontSize: size * 0.44,
                fontWeight: 700,
                color: press > 0.5 ? colors.ink : colors.graphite,
                whiteSpace: "nowrap",
              }}
            >
              {key}
            </div>
          </div>
        ))}
      </div>
      {note ? <div style={{ fontSize: size * 0.3, color: dark ? colors.terminal : colors.muted }}>{note}</div> : null}
    </div>
  );
};
