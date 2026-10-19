import { AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Logo } from "../components/Logo";
import { copy, type Lang } from "../i18n";
import { colors, fontFamily } from "../theme";

const OutroSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const text = copy[lang].outro;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page, alignItems: "center", justifyContent: "center", fontFamily }}>
      <div style={{ display: "flex", alignItems: "center", gap: 44 }}>
        <Logo
          size={170}
          style={{
            scale: interpolate(frame, [0.1 * fps, 0.45 * fps], [1.3, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.2, 0.9, 0.3, 1.25),
            }),
          }}
        />
        <div style={{ fontSize: 150, fontWeight: 800, letterSpacing: "-0.03em", color: colors.graphite }}>Flashjot</div>
      </div>
      <div style={{ marginTop: 26, fontSize: 44, color: colors.muted }}>{text.license}</div>
      <div
        style={{
          marginTop: 64,
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 40,
          rowGap: 18,
          alignItems: "baseline",
          opacity: interpolate(frame, [0.5 * fps, 1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          translate: interpolate(frame, [0.5 * fps, 1 * fps], ["0px 24px", "0px 0px"], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <div style={{ fontSize: 44, color: colors.muted, textAlign: "right" }}>{text.site}</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: colors.ink }}>flashjot.mefby.com</div>
        <div style={{ fontSize: 44, color: colors.muted, textAlign: "right" }}>{text.code}</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: colors.graphite }}>github.com/mftnakrsu/flashjot</div>
      </div>
    </AbsoluteFill>
  );
};

export const OutroScene = Interactive.create({ Component: OutroSceneInner, layout: "absolute-fill" });
