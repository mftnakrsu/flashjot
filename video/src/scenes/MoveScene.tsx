import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { Caption } from "../components/Caption";
import { InboxScreen } from "../components/InboxScreen";
import { Keys } from "../components/Keys";
import { between, VIEWS } from "../components/Screen";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { CAPTION, KEYS, STAGE } from "./layout";

/** M on the selected card opens "Move to…"; a few letters and Enter file it into the folder. */
const MoveSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang];
  const camera = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.25, 1) } as const;
  const move = 2.9 * fps;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.move.title} body={text.move.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <Keys keys={["M"]} at={0.6 * fps} until={2.2 * fps} size={KEYS.size} style={{ position: "absolute", left: KEYS.left, top: KEYS.top }} />
      <Keys keys={["Enter"]} at={move} until={4.8 * fps} size={KEYS.size} style={{ position: "absolute", left: KEYS.left, top: KEYS.top }} />
      <AppWindow width={STAGE.width} style={{ position: "absolute", left: STAGE.left, top: STAGE.top }}>
        <InboxScreen
          lang={lang}
          width={STAGE.width}
          view={between(VIEWS.cards, VIEWS.sidebar, interpolate(frame, [move + 0.1 * fps, move + 0.8 * fps], [0, 1], camera))}
          timing={{ focus: 0, dialog: 0.65 * fps, type: 1.3 * fps, typed: 1.9 * fps, move }}
        />
      </AppWindow>
    </AbsoluteFill>
  );
};

export const MoveScene = Interactive.create({ Component: MoveSceneInner, layout: "absolute-fill" });
