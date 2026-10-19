import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Desktop, DESKTOP } from "../components/Desktop";
import { Keys } from "../components/Keys";
import { QuickBox } from "../components/QuickBox";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { framed, SAFE, STAGE } from "./layout";

const BOX = { x: (DESKTOP.width - 560) / 2, y: 300 } as const;

/**
 * The first 4.5 s: the promise in big type and the quick box already open, both readable from
 * frame 0 (it doubles as the thumbnail). The note is typed and saved with Enter.
 */
const SocialHookSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline
        title={text.social.hook.title}
        size={112}
        style={{
          transformOrigin: "0% 0%",
          scale: interpolate(frame, [0, 0.4 * fps], [1.04, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <Desktop
        width={STAGE.width}
        zoom={{ scale: 2.25, x: BOX.x + 280, y: BOX.y + 84 }}
        style={{ ...framed, position: "absolute", left: STAGE.left, top: 765 }}
      >
        <QuickBox lang={lang} width={560} timing={{ type: 0.4 * fps, typed: 2.1 * fps, save: 2.5 * fps }} style={{ position: "absolute", left: BOX.x, top: BOX.y }} />
      </Desktop>
      <Keys keys={["Ctrl", "Alt", "N"]} at={0.3 * fps} until={2 * fps} size={80} style={{ position: "absolute", left: SAFE.side, top: 645 }} />
      <Keys keys={["Enter"]} at={2.5 * fps} until={4.4 * fps} size={80} style={{ position: "absolute", left: SAFE.side, top: 645 }} />
    </AbsoluteFill>
  );
};

export const SocialHookScene = Interactive.create({ Component: SocialHookSceneInner, layout: "absolute-fill" });
