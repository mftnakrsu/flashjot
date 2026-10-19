import type React from "react";
import { colors } from "../theme";
import { BuildLog, TerminalWindow } from "./Terminal";

/** The desktop is laid out at this size and scaled to the width it is shown at. */
export const DESKTOP = { width: 1280, height: 800 } as const;

type DesktopProps = {
  readonly width: number;
  /** Camera: zoom by `scale` towards (x, y), in desktop pixels. */
  readonly zoom?: { readonly scale: number; readonly x: number; readonly y: number };
  /** Drawn above the terminal, in desktop pixels. */
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** A dark desktop with a build running in a terminal: what you are doing when the idea comes. */
export const Desktop: React.FC<DesktopProps> = ({ width, zoom, children, style }) => {
  const k = width / DESKTOP.width;
  const z = zoom ?? { scale: 1, x: DESKTOP.width / 2, y: DESKTOP.height / 2 };
  return (
    <div
      style={{
        position: "relative",
        width,
        height: DESKTOP.height * k,
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor: colors.desktop,
        boxShadow: "0 30px 80px rgba(35, 38, 43, 0.25)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: DESKTOP.width,
          height: DESKTOP.height,
          transformOrigin: "0 0",
          scale: k,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformOrigin: `${z.x}px ${z.y}px`,
            scale: z.scale,
            background: `radial-gradient(circle at 75% 20%, #343a46 0%, ${colors.desktop} 60%)`,
          }}
        >
          <TerminalWindow width={760} height={560} title="flashjot — bash" fontSize={17} style={{ position: "absolute", left: 300, top: 120 }}>
            <BuildLog rows={17} every={5} />
          </TerminalWindow>
          {children}
        </div>
      </div>
    </div>
  );
};
