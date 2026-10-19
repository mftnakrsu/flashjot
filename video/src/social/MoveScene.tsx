import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { InboxScreen } from "../components/InboxScreen";
import { Keys } from "../components/Keys";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { framed, SAFE, STAGE } from "./layout";

/** The camera sits on "Move to…" while the folder is typed, then pans to the sidebar to show the new page. */
const SocialMoveSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const move = 2.5 * fps;
  const pan = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.25, 1) } as const;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].social.move.title} />
      <InboxScreen
        lang={lang}
        width={STAGE.width}
        view={{
          x: interpolate(frame, [move + 0.1 * fps, move + 0.7 * fps], [318, 0], pan),
          y: interpolate(frame, [move + 0.1 * fps, move + 0.7 * fps], [215, 30], pan),
          width: 445,
          height: 300,
        }}
        timing={{ focus: 0, dialog: 0.4 * fps, type: 0.9 * fps, typed: 1.5 * fps, move }}
        style={{ ...framed, position: "absolute", left: STAGE.left, top: 520 }}
      />
      <Keys keys={["M"]} at={0.4 * fps} until={2 * fps} size={80} style={{ position: "absolute", left: SAFE.side, top: 1240 }} />
      <Keys keys={["Enter"]} at={move} until={4.4 * fps} size={80} style={{ position: "absolute", left: SAFE.side, top: 1240 }} />
    </AbsoluteFill>
  );
};

export const SocialMoveScene = Interactive.create({ Component: SocialMoveSceneInner, layout: "absolute-fill" });
