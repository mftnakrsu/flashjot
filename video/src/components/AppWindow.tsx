import type React from "react";
import { colors, fontFamily } from "../theme";

type AppWindowProps = {
  /** Width of the window, and of the screenshot inside it. */
  readonly width: number;
  readonly title?: string;
  readonly dark?: boolean;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** Height of the title bar for a window of the given width. */
export const titleBarHeight = (width: number) => Math.round(width * 0.032);

/** A plain desktop window: title bar with the app name and the three window buttons. */
export const AppWindow: React.FC<AppWindowProps> = ({ width, title = "Flashjot", dark = false, children, style }) => {
  const bar = titleBarHeight(width);
  const glyph = bar * 0.3;
  const ink = dark ? "#979ca6" : colors.muted;
  return (
    <div
      style={{
        width,
        borderRadius: Math.max(8, width * 0.011),
        overflow: "hidden",
        backgroundColor: colors.sheet,
        boxShadow: "0 30px 80px rgba(35, 38, 43, 0.18), 0 0 0 1.5px rgba(35, 38, 43, 0.08)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          height: bar,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: dark ? "#121418" : "#e4e7ec",
          borderBottom: `1px solid ${dark ? "#2c3038" : colors.line}`,
          fontFamily,
          fontSize: bar * 0.42,
          fontWeight: 600,
          color: ink,
        }}
      >
        {title}
        <div style={{ position: "absolute", right: bar * 0.45, top: 0, height: bar, display: "flex", alignItems: "center", gap: bar * 0.62 }}>
          {/* Minimise, maximise, close. */}
          <div style={{ width: glyph, height: 1.6, backgroundColor: ink, marginTop: glyph * 0.6 }} />
          <div style={{ width: glyph * 0.9, height: glyph * 0.9, border: `1.6px solid ${ink}`, borderRadius: 1.5, boxSizing: "border-box" }} />
          <svg viewBox="0 0 10 10" width={glyph} height={glyph}>
            <path d="M1 1l8 8M9 1l-8 8" stroke={ink} strokeWidth={1.4} strokeLinecap="round" />
          </svg>
        </div>
      </div>
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};
