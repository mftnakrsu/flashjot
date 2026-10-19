import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionScripts } from "./captions";
import { Soundtrack, type SoundtrackProps } from "./components/Soundtrack";
import { Subtitles } from "./components/Subtitles";
import type { Lang } from "./i18n";
import { SocialChecklistScene } from "./social/ChecklistScene";
import { SocialFilesScene } from "./social/FilesScene";
import { SocialHookScene } from "./social/HookScene";
import { SocialInboxScene } from "./social/InboxScene";
import { SAFE, SAFE_WIDTH } from "./social/layout";
import { SocialMoveScene } from "./social/MoveScene";
import { SocialOutroScene } from "./social/OutroScene";
import { colors } from "./theme";

export type FlashjotSocialProps = SoundtrackProps & {
  readonly lang: Lang;
  /** Burned-in subtitles from src/captions.ts (on by default: most people watch muted). */
  readonly captions?: boolean;
};

/**
 * 23 s vertical cut (1080×1920) for LinkedIn, X, Reels and Shorts: 6 scenes with 0.5 s fades
 * (4.5 + 4.5 + 5 + 4 + 4 + 3.5 s, minus 5 × 0.5 s = 690 frames at 30 fps).
 */
export const FlashjotSocial: React.FC<FlashjotSocialProps> = ({ lang, captions = true, ...soundtrack }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <TransitionSeries>
        <TransitionSeries.Sequence name="Hook" durationInFrames={4.5 * fps}>
          <SocialHookScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Inbox" durationInFrames={4.5 * fps}>
          <SocialInboxScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Move" durationInFrames={5 * fps}>
          <SocialMoveScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Checklist" durationInFrames={4 * fps}>
          <SocialChecklistScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Files" durationInFrames={4 * fps}>
          <SocialFilesScene lang={lang} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 0.5 * fps })} />
        <TransitionSeries.Sequence name="Outro" durationInFrames={3.5 * fps}>
          <SocialOutroScene lang={lang} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
      {captions ? (
        <Subtitles cues={captionScripts.social.cues[lang]} fontSize={50} maxWidth={SAFE_WIDTH + 40} bottom={SAFE.captionBottom} />
      ) : null}
      <Soundtrack cues={captionScripts.social.cues[lang]} {...soundtrack} />
    </AbsoluteFill>
  );
};
