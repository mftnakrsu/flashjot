import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Keys } from "../components/Keys";
import { Logo } from "../components/Logo";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";

/**
 * Name, icon and promise. Everything is readable from the very first frame (it doubles as the
 * thumbnail); it only settles into place, and the shortcut the next scene uses comes in under it.
 */
const OpeningSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, alignItems: "center", justifyContent: "center", fontFamily }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          scale: interpolate(frame, [0, 0.8 * fps], [1.04, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <Logo
          size={230}
          style={{
            rotate: interpolate(frame, [0, 0.6 * fps], ["-8deg", "0deg"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
            }),
            filter: "drop-shadow(0 18px 30px rgba(47, 91, 211, 0.25))",
          }}
        />
        <div style={{ fontSize: 200, fontWeight: 800, letterSpacing: "-0.03em", color: colors.graphite }}>Flashjot</div>
      </div>
      <div style={{ marginTop: 56, fontSize: 60, fontWeight: 600, color: colors.graphite }}>{copy[lang].opening.tagline}</div>
      <Keys
        keys={["Ctrl", "Alt", "N"]}
        at={1.5 * fps}
        until={10 * fps}
        size={72}
        style={{ marginTop: 64, alignItems: "center" }}
      />
    </AbsoluteFill>
  );
};

export const OpeningScene = Interactive.create({ Component: OpeningSceneInner, layout: "absolute-fill" });
