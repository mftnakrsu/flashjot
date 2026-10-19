import type React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { clamp, colors, fontFamily, writerFamily } from "../theme";

type TerminalWindowProps = {
  readonly width: number;
  readonly height: number;
  readonly title: string;
  /** Font size of the terminal text; the title bar follows it. */
  readonly fontSize: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** A dark terminal window. */
export const TerminalWindow: React.FC<TerminalWindowProps> = ({ width, height, title, fontSize, children, style }) => {
  const bar = fontSize * 1.9;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: fontSize * 0.55,
        overflow: "hidden",
        backgroundColor: colors.graphite,
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          height: bar,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c1f25",
          color: "#979ca6",
          fontFamily,
          fontSize: fontSize * 0.8,
          fontWeight: 600,
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          padding: `${fontSize * 0.8}px ${fontSize}px`,
          fontFamily: writerFamily,
          fontSize,
          lineHeight: 1.5,
          color: colors.terminal,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const CRATES = [
  "proc-macro2 v1.0.101",
  "unicode-ident v1.0.19",
  "serde v1.0.228",
  "libc v0.2.176",
  "cfg-if v1.0.3",
  "memchr v2.7.6",
  "quote v1.0.41",
  "syn v2.0.106",
  "glib-sys v0.18.1",
  "gobject-sys v0.18.0",
  "smallvec v1.15.1",
  "hashbrown v0.16.0",
  "indexmap v2.11.4",
  "serde_json v1.0.145",
  "tokio v1.47.1",
  "gio-sys v0.18.1",
  "gdk-sys v0.18.2",
  "cairo-rs v0.18.5",
  "webkit2gtk v2.0.1",
  "tao v0.34.3",
  "wry v0.53.3",
  "tauri-utils v2.7.0",
  "tauri-runtime v2.8.0",
  "tauri-runtime-wry v2.8.1",
  "tauri v2.8.5",
  "tauri-plugin-global-shortcut v2.3.0",
  "flashjot v0.1.0 (/home/you/flashjot/src-tauri)",
];

type BuildLogProps = {
  /** How many lines fit. */
  readonly rows: number;
  /** Frames per new line. */
  readonly every: number;
};

/** A Rust build scrolling by: the "middle of a build" the quick box interrupts. */
export const BuildLog: React.FC<BuildLogProps> = ({ rows, every }) => {
  const frame = useCurrentFrame();
  const done = Math.min(CRATES.length - 1, 6 + Math.floor(frame / every));
  const lines = CRATES.slice(0, done + 1).slice(-(rows - 2));
  const progress = Math.round(interpolate(frame, [0, every * CRATES.length], [184, 498], clamp));
  const filled = Math.round((progress / 498) * 24);
  return (
    <div style={{ whiteSpace: "pre" }}>
      <div>
        <span style={{ color: colors.prompt }}>$ </span>npm run tauri build
      </div>
      {lines.map((crate) => (
        <div key={crate}>
          <span style={{ color: "#4cc38a", fontWeight: 700 }}>{"   Compiling "}</span>
          {crate}
        </div>
      ))}
      <div>
        <span style={{ color: "#8ca8ff", fontWeight: 700 }}>{"    Building "}</span>[{"=".repeat(filled)}
        {">"}
        {" ".repeat(24 - filled)}] {progress}/498
      </div>
    </div>
  );
};
