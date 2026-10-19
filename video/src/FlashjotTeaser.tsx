import { AbsoluteFill, useVideoConfig } from "remotion";
import { InboxScreen } from "./components/InboxScreen";
import { QuickBox } from "./components/QuickBox";
import { framed } from "./social/layout";
import { colors } from "./theme";

/**
 * 8 s loop for the README GIF: a note is typed into the quick box and saved, and its card drops
 * into the Inbox; then the card leaves again. Frames 225–239 and 0–14 show the same resting
 * state, so the GIF loops without a seam.
 */
export const FlashjotTeaser: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <QuickBox
        lang="en"
        width={800}
        timing={{ type: 0.5 * fps, typed: 2.6 * fps, save: 3 * fps, reset: 4 * fps }}
        style={{ position: "absolute", left: 70, top: 420, borderRadius: 4 }}
      />
      <InboxScreen
        lang="en"
        width={920}
        view={{ x: 285, y: 30, width: 610, height: 420 }}
        timing={{ arrive: 3.3 * fps, reset: 7 * fps }}
        style={{ ...framed, position: "absolute", left: 930, top: 235 }}
      />
    </AbsoluteFill>
  );
};
