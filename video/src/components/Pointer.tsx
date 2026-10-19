import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { clamp, colors } from "../theme";

type Stop = { readonly frame: number; readonly x: number; readonly y: number };

type PointerProps = {
  /** Where the tip of the arrow is, at increasing frames; it glides between stops. */
  readonly path: readonly Stop[];
  /** Frames of the clicks; each one shows a ring where the tip is. */
  readonly clicks?: readonly number[];
  /** Arrow height in the parent's px. */
  readonly size?: number;
  readonly appear?: number;
};

/** A mouse pointer that glides between stops and clicks. */
export const Pointer: React.FC<PointerProps> = ({ path, clicks = [], size = 22, appear }) => {
  const frame = useCurrentFrame();
  const frames = path.map((p) => p.frame);
  const ease = { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) };
  const x = path.length > 1 ? interpolate(frame, frames, path.map((p) => p.x), ease) : path[0].x;
  const y = path.length > 1 ? interpolate(frame, frames, path.map((p) => p.y), ease) : path[0].y;
  const start = appear ?? path[0].frame;
  const opacity = interpolate(frame, [start - 6, start], [0, 1], clamp);
  const pressed = clicks.some((c) => frame >= c && frame < c + 4);
  return (
    <>
      {clicks.map((c) => (
        <div
          key={c}
          style={{
            position: "absolute",
            left: x - size,
            top: y - size,
            width: size * 2,
            height: size * 2,
            borderRadius: 999,
            border: `${size * 0.12}px solid ${colors.ink}`,
            opacity: interpolate(frame, [c, c + 2, c + 14], [0, 0.7, 0], clamp),
            scale: interpolate(frame, [c, c + 14], [0.3, 1.1], clamp),
          }}
        />
      ))}
      <svg
        viewBox="0 0 20 24"
        width={(size * 20) / 24}
        height={size}
        style={{
          position: "absolute",
          left: x - size * 0.06,
          top: y - size * 0.03,
          opacity,
          scale: pressed ? 0.88 : 1,
          transformOrigin: "0 0",
          filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.35))",
        }}
      >
        <path d="M1.5 1.5v18.2l4.6-4.4 3 6.9 3.2-1.4-3-6.8h6.4z" fill="#111" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </>
  );
};
