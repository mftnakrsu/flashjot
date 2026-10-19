import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionScripts } from "./captions";
import { Soundtrack, type SoundtrackProps } from "./components/Soundtrack";
import { Subtitles } from "./components/Subtitles";
import type { Lang } from "./i18n";
import { CaptureScene } from "./scenes/CaptureScene";
import { ChecklistScene } from "./scenes/ChecklistScene";
import { EverywhereScene } from "./scenes/EverywhereScene";
import { FilesScene } from "./scenes/FilesScene";
import { InboxScene } from "./scenes/InboxScene";
import { SUBTITLES } from "./scenes/layout";
import { MoveScene } from "./scenes/MoveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { colors } from "./theme";

export type FlashjotDemoProps = SoundtrackProps & {
  readonly lang: Lang;
  /** Burned-in subtitles from src/captions.ts (on by default: the video is silent). */
  readonly captions?: boolean;
};

/**
 * 39.5 s product demo: 8 scenes with 0.5 s fades between them
 * (3.5 + 7 + 6 + 6.5 + 5.5 + 5.5 + 4.5 + 4.5 s, minus 7 × 0.5 s = 1185 frames at 30 fps).
 */
export const FlashjotDemo: React.FC<FlashjotDemoProps> = ({ lang, captions = true, ...soundtrack }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Opening" durationInFrames={3.5 * fps}>
          <OpeningScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Capture" durationInFrames={7 * fps}>
          <CaptureScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Inbox" durationInFrames={6 * fps}>
          <InboxScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Move" durationInFrames={6.5 * fps}>
          <MoveScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Checklist" durationInFrames={5.5 * fps}>
          <ChecklistScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Files" durationInFrames={5.5 * fps}>
          <FilesScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Everywhere" durationInFrames={4.5 * fps}>
          <EverywhereScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={4.5 * fps}>
          <OutroScene lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {captions ? (
        <Subtitles cues={captionScripts.demo.cues[lang]} fontSize={SUBTITLES.fontSize} maxWidth={SUBTITLES.maxWidth} bottom={SUBTITLES.bottom} />
      ) : null}
      <Soundtrack cues={captionScripts.demo.cues[lang]} {...soundtrack} />
    </AbsoluteFill>
  );
};
