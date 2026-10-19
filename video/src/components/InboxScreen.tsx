import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { copy, type Lang } from "../i18n";
import { colors, writerFamily } from "../theme";
import { APP_TEXT, Caret, Cover, Crop, NOTEBOOK, type Rect, Screen, shot, typed } from "./Screen";
import { FileTextIcon, FolderIcon, FolderPlusIcon, HouseIcon } from "./Logo";

/** Geometry of the Inbox screenshots, in CSS pixels (measured on inbox-<lang>.png). */
export const CARD = { x: 304, y: 107, width: 568, height: 80, pitch: 92 } as const;
const SIDEBAR_WIDTH = 263;
const ROW = { top: 127.5, height: 30, textX: 51, baseline: 19.5 } as const;
/** The Move dialog in move-en.png; its contents are redrawn per language and state. */
export const DIALOG: Rect = { x: 331, y: 230.5, width: 417.5, height: 213.5 };

export type InboxTiming = {
  /** The new note slides in at the top. Leave out when it is already there. */
  readonly arrive?: number;
  /** Keyboard focus ring on the new card. */
  readonly focus?: number;
  /** "Move to…" opens; the folder query is typed from `type` to `typed`. */
  readonly dialog?: number;
  readonly type?: number;
  readonly typed?: number;
  /** Enter in the dialog: the card leaves the Inbox and the page appears in the folder. */
  readonly move?: number;
  /** For loops: the new card fades out again and the list goes back to its first state. */
  readonly reset?: number;
};

type InboxScreenProps = {
  readonly lang: Lang;
  readonly width: number;
  readonly view?: Rect;
  readonly timing: InboxTiming;
  readonly style?: React.CSSProperties;
};

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.45, 0, 0.25, 1);

/**
 * The notebook on the Inbox (inbox-<lang>.png), with the parts that move redrawn: the new note's
 * card, the badge count, the Move dialog and the folder's page list in the sidebar.
 */
export const InboxScreen: React.FC<InboxScreenProps> = ({ lang, width, view, timing, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang];
  const src = shot("inbox", lang);
  /** 0 → 1 over `seconds` from `at`; 0 when the event does not happen, 1 when `at` is left out and `whenMissing` is 1. */
  const step = (at: number | undefined, seconds: number, easing = easeOut, whenMissing = 0) =>
    at === undefined
      ? whenMissing
      : interpolate(frame, [at, at + seconds * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

  const arrive = step(timing.arrive, 0.55, easeOut, 1);
  const leave = step(timing.move, 0.45, easeInOut);
  const reset = step(timing.reset, 0.5, easeInOut);
  const gone = Math.max(leave, reset);
  // The old cards make room for the new one, and close the gap again when it goes.
  const listShift = CARD.pitch * (arrive - step(timing.move === undefined ? undefined : timing.move + 0.25 * fps, 0.45, easeInOut) - reset);
  const dialogOpen = timing.dialog !== undefined && frame >= timing.dialog && (timing.move === undefined || frame < timing.move);
  const dialogIn = step(timing.dialog, 0.18);
  const rowIn = step(timing.move === undefined ? undefined : timing.move + 0.35 * fps, 0.45, easeInOut);
  const count = 3 + (arrive > 0.5 ? 1 : 0) - (leave > 0.5 || reset > 0.5 ? 1 : 0);
  const query = timing.type !== undefined && timing.typed !== undefined ? typed(text.note.query, frame, timing.type, timing.typed) : "";
  const [folder, otherFolder] = text.note.folders;
  const choices: { readonly icon: "folder" | "new" | "home"; readonly label: string }[] =
    query === ""
      ? [
          { icon: "folder", label: folder },
          { icon: "folder", label: otherFolder },
          { icon: "home", label: text.app.rootFolder },
        ]
      : [
          { icon: "folder", label: folder },
          { icon: "new", label: `${text.app.newFolderOption} “${query}”` },
          { icon: "home", label: text.app.rootFolder },
        ];
  // The new page is highlighted for a moment, like the active row.
  const highlight =
    interpolate(rowIn, [0.6, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *(1 - step(timing.move === undefined ? undefined : timing.move + 1.8 * fps, 0.5));
  const insertTop = ROW.top + ROW.height * text.note.insertAt;
  const focusRing = timing.focus !== undefined && frame >= timing.focus && gone === 0;

  return (
    <Screen src={src} size={NOTEBOOK} width={width} view={view} style={style}>
      {/* Cards: the screenshot's three, moved down by one place while the new one is there. */}
      <Cover x={300} y={104} width={580} height={420} color={colors.sheet} />
      <Crop src={src} size={NOTEBOOK} from={{ x: 300, y: 104, width: 580, height: 276 }} x={300} y={104 + listShift} />
      {arrive > 0 && gone < 1 ? (
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.width,
            height: CARD.height,
            boxSizing: "border-box",
            padding: "10px 16px 12px",
            backgroundColor: colors.sheet,
            border: `1px solid ${colors.line}`,
            borderTop: `2px solid ${colors.cardRule}`,
            borderRadius: "3px 3px 8px 8px",
            boxShadow: focusRing ? `0 0 0 2px ${colors.sheet}, 0 0 0 4px ${colors.ink}` : undefined,
            opacity: arrive * (1 - gone),
            translate: `${leave * 60}px ${(1 - arrive) * -36}px`,
            scale: 0.97 + 0.03 * arrive,
          }}
        >
          <div style={{ minHeight: 28, display: "flex", alignItems: "center", fontSize: 13 * APP_TEXT, color: colors.muted }}>{text.note.date}</div>
          <div style={{ marginTop: 2, fontFamily: writerFamily, fontSize: 17 * APP_TEXT, lineHeight: `${17 * 1.6}px`, whiteSpace: "nowrap" }}>{text.note.text}</div>
        </div>
      ) : null}

      {/* Badge on the Inbox row. */}
      <Cover x={224} y={64} width={26} height={23} color={colors.inkSoft} />
      <div
        style={{
          position: "absolute",
          left: 227.5,
          top: 67,
          width: 19,
          height: 17,
          borderRadius: 9,
          backgroundColor: colors.cardRule,
          color: colors.sheet,
          fontSize: 12 * APP_TEXT,
          fontWeight: 700,
          lineHeight: "17px",
          textAlign: "center",
        }}
      >
        {count}
      </div>

      {/* Sidebar: the new page takes its place among the folder's pages, sorted by title. */}
      {rowIn > 0 ? (
        <>
          <Cover x={0} y={insertTop} width={SIDEBAR_WIDTH} height={335 - insertTop} color={colors.side} />
          <Crop
            src={src}
            size={NOTEBOOK}
            from={{ x: 0, y: insertTop, width: SIDEBAR_WIDTH, height: 335 - insertTop }}
            x={0}
            y={insertTop + ROW.height * rowIn}
          />
          <div style={{ position: "absolute", left: 0, top: insertTop, width: SIDEBAR_WIDTH, height: ROW.height, opacity: rowIn }}>
            <div
              style={{
                position: "absolute",
                left: 25,
                top: 0,
                width: 203.5,
                height: 29.5,
                borderRadius: 6,
                backgroundColor: colors.inkSoft,
                opacity: highlight,
              }}
            />
            <FileTextIcon size={14} color={highlight > 0.5 ? colors.ink : colors.muted} style={{ position: "absolute", left: 30, top: 8 }} />
            <div
              style={{
                position: "absolute",
                left: ROW.textX,
                top: ROW.baseline - 0.834 * 15 * APP_TEXT,
                width: 170,
                fontSize: 15 * APP_TEXT,
                lineHeight: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                color: highlight > 0.5 ? colors.ink : colors.graphite,
              }}
            >
              {text.note.text}
            </div>
          </div>
        </>
      ) : null}

      {/* The Move dialog over a dimmed window. */}
      {dialogOpen ? (
        <>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(20, 22, 28, 0.35)", opacity: dialogIn }} />
          <div
            style={{
              position: "absolute",
              left: DIALOG.x,
              top: DIALOG.y,
              width: DIALOG.width,
              height: DIALOG.height,
              opacity: dialogIn,
              scale: 0.97 + 0.03 * dialogIn,
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: 12, boxShadow: "0 18px 50px rgba(0, 0, 0, 0.22)" }} />
            <Crop
              src={shot("move", "en")}
              size={NOTEBOOK}
              from={DIALOG}
              x={0}
              y={0}
              style={{ borderRadius: 12 }}
            />
            {/* In dialog coordinates from here on. */}
            <Cover x={12} y={18} width={200} height={20} color={colors.sheet} />
            <TextLine x={18} baseline={34.5} weight={700}>
              {text.app.moveTo}
            </TextLine>
            <Cover x={20} y={45} width={377} height={35} color={colors.paper} />
            <div style={{ position: "absolute", left: 29, top: 70.5 - 0.834 * 15 * APP_TEXT, fontSize: 15 * APP_TEXT, lineHeight: 1, whiteSpace: "nowrap" }}>
              {query}
              <Caret frame={frame} fps={fps} height={18} typedAt={timing.typed} />
            </div>
            <Cover x={10} y={92} width={397} height={110} color={colors.sheet} />
            {choices.map((choice, i) => {
              const baseline = 117.5 + 34 * i;
              const Icon = choice.icon === "folder" ? FolderIcon : choice.icon === "new" ? FolderPlusIcon : HouseIcon;
              return (
                <div key={choice.icon + i}>
                  <Icon size={15} color={colors.graphite} style={{ position: "absolute", left: 26, top: baseline - 12 }} />
                  <TextLine x={48.5} baseline={baseline}>
                    {choice.label}
                  </TextLine>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </Screen>
  );
};

/** One line of interface text placed by its baseline (see TextAt in the oyla video for the 0.834). */
const TextLine: React.FC<{
  readonly x: number;
  readonly baseline: number;
  readonly size?: number;
  readonly weight?: number;
  readonly color?: string;
  readonly children: React.ReactNode;
}> = ({ x, baseline, size = 15, weight = 400, color = colors.graphite, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: baseline - 0.834 * size * APP_TEXT,
      fontSize: size * APP_TEXT,
      lineHeight: 1,
      fontWeight: weight,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);
