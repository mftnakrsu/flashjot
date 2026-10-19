import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";
import { SAFE, SOCIAL } from "./layout";

const SocialOutroSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].social.outro;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, fontFamily, alignItems: "center" }}>
      <div
        style={{
          position: "absolute",
          top: SAFE.top + 120,
          width: SOCIAL.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Logo
          size={260}
          style={{
            scale: interpolate(frame, [0.05 * fps, 0.4 * fps], [1.25, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
            }),
          }}
        />
        <div style={{ marginTop: 40, fontSize: 150, fontWeight: 800, letterSpacing: "-0.03em", color: colors.graphite }}>Flashjot</div>
        <div style={{ marginTop: 16, fontSize: 56, fontWeight: 700, color: colors.graphite }}>{text.tagline}</div>
        <div style={{ marginTop: 12, fontSize: 44, color: colors.muted }}>{text.systems}</div>
        <div
          style={{
            marginTop: 80,
            padding: "22px 44px",
            borderRadius: 999,
            backgroundColor: colors.ink,
            color: colors.sheet,
            fontSize: 58,
            fontWeight: 800,
            opacity: interpolate(frame, [0.4 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            translate: interpolate(frame, [0.4 * fps, 0.8 * fps], ["0px 24px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          flashjot.mefby.com
        </div>
        <div style={{ marginTop: 28, fontSize: 40, color: colors.muted }}>github.com/mftnakrsu/flashjot</div>
      </div>
    </AbsoluteFill>
  );
};

export const SocialOutroScene = Interactive.create({ Component: SocialOutroSceneInner, layout: "absolute-fill" });
