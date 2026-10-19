import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { Caption } from "../components/Caption";
import { PageScreen } from "../components/PageScreen";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";
import { CAPTION, STAGE } from "./layout";

const Chip: React.FC<{ readonly children: string; readonly strong?: boolean }> = ({ children, strong = false }) => (
  <div
    style={{
      padding: "10px 26px",
      borderRadius: 999,
      fontFamily,
      fontSize: 34,
      fontWeight: 700,
      backgroundColor: strong ? colors.ink : colors.sheet,
      color: strong ? colors.sheet : colors.graphite,
      border: strong ? "none" : `2px solid ${colors.line}`,
    }}
  >
    {children}
  </div>
);

/** Linux, Windows and macOS; the page wipes from the light theme to the dark one and back. */
const EverywhereSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].everywhere;
  const ease = Easing.bezier(0.45, 0, 0.25, 1);
  // How much of the window, from the right, shows the dark theme.
  const dark = interpolate(frame, [0.9 * fps, 1.7 * fps, 3.2 * fps, 3.9 * fps], [0, 100, 100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <div style={{ position: "absolute", left: CAPTION.left, top: 700, width: CAPTION.width, display: "flex", flexWrap: "wrap", gap: 16 }}>
        {text.systems.map((name) => (
          <Chip key={name} strong>
            {name}
          </Chip>
        ))}
        {text.extras.map((name) => (
          <Chip key={name}>{name}</Chip>
        ))}
      </div>
      <div style={{ position: "absolute", left: STAGE.left, top: STAGE.top }}>
        <AppWindow width={STAGE.width}>
          <PageScreen lang={lang} width={STAGE.width} />
        </AppWindow>
        <AppWindow width={STAGE.width} dark style={{ position: "absolute", left: 0, top: 0, clipPath: `inset(0 0 0 ${100 - dark}%)` }}>
          <PageScreen lang={lang} width={STAGE.width} dark />
        </AppWindow>
      </div>
    </AbsoluteFill>
  );
};

export const EverywhereScene = Interactive.create({ Component: EverywhereSceneInner, layout: "absolute-fill" });
