import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { copy, type Lang } from "../i18n";
import { clamp, colors, writerFamily } from "../theme";
import { APP_TEXT, Caret, Cover, QUICK, Screen, shot, typed } from "./Screen";

/** The quick box inside the quick screenshots, in their CSS pixels. */
export const QUICK_BOX = { x: 120, y: 141.5, width: 560, height: 168 } as const;

export type QuickBoxTiming = {
  /** Typing runs from `type` to `typed`. */
  readonly type: number;
  readonly typed: number;
  /** Enter: the text is saved, the rule turns green and the footer says so. */
  readonly save: number;
  /** For loops: back to the empty box with its hints, as it is when it opens. */
  readonly reset?: number;
};

type QuickBoxProps = {
  readonly lang: Lang;
  /** Displayed width; the box is 560×168 in the app. */
  readonly width: number;
  readonly timing: QuickBoxTiming;
  readonly style?: React.CSSProperties;
};

/**
 * The quick box from the screenshot, with the text area and the footer redrawn: the note is typed
 * in, and on Enter the box clears, the red rule fills with green and the footer reads
 * "✓ Saved to Inbox", as in src/routes/quick/+page.svelte.
 */
export const QuickBox: React.FC<QuickBoxProps> = ({ lang, width, timing, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang];
  const saved = frame >= timing.save && (timing.reset === undefined || frame < timing.reset);
  const value = frame >= timing.save ? "" : typed(text.note.text, frame, timing.type, timing.typed);
  const box = QUICK_BOX;
  return (
    <Screen
      src={shot("quick", lang)}
      size={QUICK}
      width={width}
      view={box}
      style={{ boxShadow: "0 24px 70px rgba(0, 0, 0, 0.45)", ...style }}
    >
      {/* Text area: the screenshot's own note is replaced by the one typed here. */}
      <Cover x={box.x + 1} y={183} width={box.width - 2} height={93} color={colors.sheet} />
      <div
        style={{
          position: "absolute",
          left: box.x + 17,
          top: 193.5,
          width: box.width - 34,
          fontFamily: writerFamily,
          fontSize: 17 * APP_TEXT,
          lineHeight: `${17 * 1.55}px`,
          color: colors.graphite,
          whiteSpace: "pre-wrap",
        }}
      >
        {value === "" ? (
          <>
            {saved ? null : <Caret frame={frame} fps={fps} height={20} typedAt={timing.type} />}
            <span style={{ color: colors.muted, opacity: 0.7 }}>{text.app.placeholder}</span>
          </>
        ) : (
          <>
            {value}
            <Caret frame={frame} fps={fps} height={20} typedAt={Math.min(frame, timing.typed)} />
          </>
        )}
      </div>
      {/* The rule fills with green from the left, 380 ms. */}
      <div
        style={{
          position: "absolute",
          left: box.x + 1,
          top: 180.5,
          height: 2,
          width: saved ? (box.width - 2) * interpolate(frame, [timing.save, timing.save + 0.38 * fps], [0, 1], clamp) : 0,
          backgroundColor: colors.ok,
        }}
      />
      {saved ? (
        <>
          <Cover x={box.x + 1} y={276} width={box.width - 2} height={32.5} color={colors.sheet} />
          <div
            style={{
              position: "absolute",
              left: box.x + 15,
              top: 280,
              fontSize: 13 * APP_TEXT,
              lineHeight: "20px",
              fontWeight: 600,
              color: colors.ok,
            }}
          >
            ✓ {text.app.savedToInbox}
          </div>
        </>
      ) : null}
    </Screen>
  );
};
