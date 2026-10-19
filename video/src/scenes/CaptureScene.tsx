import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { Desktop, DESKTOP } from "../components/Desktop";
import { Keys } from "../components/Keys";
import { QuickBox } from "../components/QuickBox";
import { copy, type Lang } from "../i18n";
import { clamp, colors } from "../theme";
import { CAPTION, KEYS, STAGE } from "./layout";

/** Where the quick box opens on the desktop (it is 560×168), and the camera's zoom on it. */
const BOX = { x: (DESKTOP.width - 560) / 2, y: 150 } as const;
const ZOOM = 1.9;

/**
 * Ctrl+Alt+N in the middle of a build: the quick box opens, the camera moves in, the idea is typed
 * and saved with Enter, and the box gets out of the way again.
 */
const CaptureSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].capture;
  const open = 0.9 * fps;
  const save = 4.5 * fps;
  const hide = save + 0.8 * fps;
  const zoomIn = interpolate(frame, [open + 3, open + 0.75 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  const zoomOut = interpolate(frame, [hide, hide + 0.7 * fps], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <Keys
        keys={["Ctrl", "Alt", "N"]}
        at={0.6 * fps}
        until={3.6 * fps}
        size={KEYS.size}
        note={copy[lang].mac.quick}
        style={{ position: "absolute", left: KEYS.left, top: KEYS.top }}
      />
      <Keys keys={["Enter"]} at={save} until={6.4 * fps} size={KEYS.size} style={{ position: "absolute", left: KEYS.left, top: KEYS.top }} />
      <Desktop
        width={STAGE.width}
        zoom={{ scale: 1 + (ZOOM - 1) * zoomIn * (1 - zoomOut), x: BOX.x + 280, y: BOX.y + 84 }}
        style={{ position: "absolute", left: STAGE.left, top: STAGE.top + 20 }}
      >
        {frame >= open && frame < hide + 0.25 * fps ? (
          <QuickBox
            lang={lang}
            width={560}
            timing={{ type: 1.5 * fps, typed: 4.0 * fps, save }}
            style={{
              position: "absolute",
              left: BOX.x,
              top: BOX.y,
              opacity: interpolate(frame, [open, open + 4, hide, hide + 0.25 * fps], [0, 1, 1, 0], clamp),
              scale: interpolate(frame, [open, open + 5], [0.96, 1], clamp),
            }}
          />
        ) : null}
      </Desktop>
    </AbsoluteFill>
  );
};

export const CaptureScene = Interactive.create({ Component: CaptureSceneInner, layout: "absolute-fill" });
