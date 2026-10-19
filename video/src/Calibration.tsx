import { AbsoluteFill, useVideoConfig } from "remotion";
import { InboxScreen } from "./components/InboxScreen";
import { PageScreen } from "./components/PageScreen";
import { QuickBox } from "./components/QuickBox";
import type { Lang } from "./i18n";

export type CalibrationProps = {
  readonly which: "quick" | "inbox" | "move" | "page";
  readonly lang: Lang;
};

/**
 * Draws a redrawn screen at the screenshot's own 2× size, in the state the screenshot shows, so
 * a still of it can be compared with the screenshot pixel by pixel (see scripts/prepare-shots.py).
 * Frame 0 shows the state; later frames play the screen's animation.
 */
export const Calibration: React.FC<CalibrationProps> = ({ which, lang }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#ff00ff" }}>
      {which === "quick" ? <QuickBox lang={lang} width={1120} timing={{ type: -2 * fps, typed: -fps, save: 3 * fps }} /> : null}
      {which === "inbox" ? <InboxScreen lang={lang} width={2160} timing={{ arrive: 0.5 * fps, focus: 1.5 * fps }} /> : null}
      {which === "move" ? (
        <InboxScreen
          lang={lang}
          width={2160}
          timing={{ dialog: -3 * fps, type: -2 * fps, typed: -fps, move: 1 * fps }}
        />
      ) : null}
      {which === "page" ? <PageScreen lang={lang} width={2160} ticks={[0.5 * fps, 1.5 * fps]} /> : null}
    </AbsoluteFill>
  );
};
