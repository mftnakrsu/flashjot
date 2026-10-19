import type React from "react";
import { Img, staticFile } from "remotion";
import { colors, fontFamily } from "../theme";

export type Size = { readonly width: number; readonly height: number };
export type Rect = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

/**
 * Screenshot sizes in CSS pixels of the app (the files are captured at 2×): the notebook window is
 * 1080×675, the quick box shots show the 560×168 box on an 800×450 piece of desktop.
 */
export const NOTEBOOK: Size = { width: 1080, height: 675 };
export const QUICK: Size = { width: 800, height: 450 };

/**
 * The screenshots come from WebKitGTK, which draws text about 4% smaller than Chrome does at the
 * same CSS size. Redrawn text is scaled by this, so it matches the text around it.
 */
export const APP_TEXT = 0.96;

export const shot = (name: string, lang: string) => `shots/${name}-${lang}.png`;

type ScreenProps = {
  readonly src: string;
  readonly size: Size;
  /** Displayed width in px; the height follows `view`. */
  readonly width: number;
  /** The part of the screenshot to show, in its CSS pixels. Default: all of it. */
  readonly view?: Rect;
  /** Drawn on top, in the app's CSS pixels, so the app's own CSS values apply as they are. */
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/** A real screenshot of the app, with a layer that redraws the parts that move. */
export const Screen: React.FC<ScreenProps> = ({ src, size, width, view, children, style }) => {
  const v = view ?? { x: 0, y: 0, width: size.width, height: size.height };
  const k = width / v.width;
  return (
    <div style={{ position: "relative", width, height: v.height * k, overflow: "hidden", ...style }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: size.width,
          height: size.height,
          transformOrigin: "0 0",
          translate: `${-v.x * k}px ${-v.y * k}px`,
          scale: k,
          fontFamily,
          color: colors.graphite,
          fontSize: 15 * APP_TEXT,
          lineHeight: 1.45,
        }}
      >
        <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%" }} />
        {children}
      </div>
    </div>
  );
};

type CropProps = {
  readonly src: string;
  readonly size: Size;
  /** The piece of the screenshot to copy, in CSS pixels. */
  readonly from: Rect;
  /** Where to draw it. */
  readonly x: number;
  readonly y: number;
  readonly style?: React.CSSProperties;
};

/** Copies a piece of a screenshot somewhere else, e.g. to move a list down by one row. */
export const Crop: React.FC<CropProps> = ({ src, size, from, x, y, style }) => (
  <div style={{ position: "absolute", left: x, top: y, width: from.width, height: from.height, overflow: "hidden", ...style }}>
    <Img
      src={staticFile(src)}
      style={{ position: "absolute", left: -from.x, top: -from.y, width: size.width, height: size.height, maxWidth: "none" }}
    />
  </div>
);

/** Paints over part of a screenshot with a flat colour, so it can be redrawn. */
export const Cover: React.FC<Rect & { readonly color: string; readonly style?: React.CSSProperties }> = ({
  x,
  y,
  width,
  height,
  color,
  style,
}) => <div style={{ position: "absolute", left: x, top: y, width, height, backgroundColor: color, ...style }} />;

/** The text caret of a focused field: on while typing, then blinking every half second. */
export const Caret: React.FC<{
  readonly frame: number;
  readonly fps: number;
  readonly height: number;
  readonly color?: string;
  /** Last frame that changed the text; the caret stays on until half a second after it. */
  readonly typedAt?: number;
}> = ({ frame, fps, height, color = colors.graphite, typedAt = -Infinity }) => {
  const on = frame - typedAt < 0.5 * fps || Math.floor(frame / (0.5 * fps)) % 2 === 0;
  return (
    <span
      style={{
        display: "inline-block",
        width: 1.5,
        height,
        marginLeft: 1,
        verticalAlign: "middle",
        backgroundColor: color,
        opacity: on ? 1 : 0,
      }}
    />
  );
};

/** A camera move between two views; `t` runs 0 → 1. Keep both views 16:10 so the window keeps its size. */
export const between = (from: Rect, to: Rect, t: number): Rect => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
  width: from.width + (to.width - from.width) * t,
  height: from.height + (to.height - from.height) * t,
});

/** Views of the notebook screenshots used by the scenes, in CSS pixels, all 16:10. */
export const VIEWS = {
  full: { x: 0, y: 0, width: 1080, height: 675 },
  /** The Inbox badge and the cards. */
  cards: { x: 262, y: 31, width: 680, height: 425 },
  /** The sidebar's folders and the left part of the cards. */
  sidebar: { x: 0, y: 0, width: 720, height: 450 },
  /** A page's title, text and checklist. */
  page: { x: 250, y: 30, width: 720, height: 450 },
} as const;

/** How many characters of `text` are typed by `frame`, typing evenly from `start` to `end`. */
export const typed = (text: string, frame: number, start: number, end: number) => {
  if (frame <= start) return "";
  if (frame >= end) return text;
  return text.slice(0, Math.round(((frame - start) / (end - start)) * text.length));
};
