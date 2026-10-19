import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { copy, type Lang } from "../i18n";
import { clamp, colors } from "../theme";
import { APP_TEXT, Cover, Crop, NOTEBOOK, type Rect, Screen, shot } from "./Screen";

/** The first checkbox of page-<lang>.png (ticked), in CSS pixels; the next ones follow every 27 px. */
export const CHECKBOX = { x: 320, y: 192.5, size: 18, pitch: 27 } as const;
/** Where to click to tick the checkbox at `index` (0 is the first, already ticked). */
export const checkboxCenter = (index: number) => ({
  x: CHECKBOX.x + CHECKBOX.size / 2 + 0.5,
  y: CHECKBOX.y + CHECKBOX.size / 2 + 0.5 + CHECKBOX.pitch * index,
});

type PageScreenProps = {
  readonly lang: Lang;
  readonly width: number;
  readonly view?: Rect;
  /** Frames at which the second, third, … checkbox gets ticked. */
  readonly ticks?: readonly number[];
  readonly dark?: boolean;
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * The "Robot arm" page (page-<lang>.png). Ticking a checkbox copies the ticked box of the first
 * item over the next ones, and the save state in the top bar reads "Saving…" for a moment.
 */
export const PageScreen: React.FC<PageScreenProps> = ({ lang, width, view, ticks = [], dark = false, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const src = shot(dark ? "page-dark" : "page", lang);
  const saving = ticks.some((t) => frame >= t && frame < t + 0.4 * fps);
  return (
    <Screen src={src} size={NOTEBOOK} width={width} view={view} style={style}>
      {ticks.map((t, i) => (
        <Crop
          key={t}
          src={src}
          size={NOTEBOOK}
          from={{ x: CHECKBOX.x - 1, y: CHECKBOX.y - 1, width: CHECKBOX.size + 2, height: CHECKBOX.size + 2 }}
          x={CHECKBOX.x - 1}
          y={CHECKBOX.y - 1 + CHECKBOX.pitch * (i + 1)}
          style={{
            opacity: interpolate(frame, [t, t + 2], [0, 1], clamp),
            scale: interpolate(frame, [t, t + 3, t + 7], [0.7, 1.12, 1], clamp),
          }}
        />
      ))}
      {saving && !dark ? (
        <>
          <Cover x={840} y={16} width={125} height={20} color={colors.sheet} />
          <div style={{ position: "absolute", right: 1080 - 962.5, top: 29 - 0.834 * 13 * APP_TEXT, fontSize: 13 * APP_TEXT, lineHeight: 1, color: colors.muted }}>
            {copy[lang].app.saving}
          </div>
        </>
      ) : null}
      {children}
    </Screen>
  );
};
