import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { Caption } from "../components/Caption";
import { InboxScreen } from "../components/InboxScreen";
import { Keys } from "../components/Keys";
import { between, VIEWS } from "../components/Screen";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { CAPTION, KEYS, STAGE } from "./layout";

/** Ctrl+Alt+D opens the notebook on the Inbox, and the note from the quick box drops in on top. */
const InboxSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang];
  const camera = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.25, 1) } as const;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.inbox.title} body={text.inbox.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <Keys
        keys={["Ctrl", "Alt", "D"]}
        at={0.4 * fps}
        until={3.2 * fps}
        size={KEYS.size}
        note={text.mac.notebook}
        style={{ position: "absolute", left: KEYS.left, top: KEYS.top }}
      />
      <AppWindow
        width={STAGE.width}
        style={{
          position: "absolute",
          left: STAGE.left,
          top: STAGE.top,
          opacity: interpolate(frame, [0.45 * fps, 0.7 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0.45 * fps, 0.95 * fps], ["0px 50px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <InboxScreen
          lang={lang}
          width={STAGE.width}
          view={between(VIEWS.full, VIEWS.cards, interpolate(frame, [1 * fps, 1.7 * fps], [0, 1], camera))}
          timing={{ arrive: 1.8 * fps, focus: 3.8 * fps }}
        />
      </AppWindow>
    </AbsoluteFill>
  );
};

export const InboxScene = Interactive.create({ Component: InboxSceneInner, layout: "absolute-fill" });
