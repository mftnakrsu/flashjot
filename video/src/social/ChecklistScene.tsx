import { AbsoluteFill, Interactive, useVideoConfig } from "remotion";
import { checkboxCenter, PageScreen } from "../components/PageScreen";
import { Pointer } from "../components/Pointer";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { framed, STAGE } from "./layout";

/** Close on the page's checklist: two boxes ticked with the mouse. */
const SocialChecklistSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const { fps } = useVideoConfig();
  const first = checkboxCenter(1);
  const second = checkboxCenter(2);
  const clicks = [1.2 * fps, 2.2 * fps];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].social.checklist.title} />
      <PageScreen
        lang={lang}
        width={STAGE.width}
        view={{ x: 268, y: 40, width: 540, height: 400 }}
        ticks={clicks}
        style={{ ...framed, position: "absolute", left: STAGE.left, top: 540 }}
      >
        <Pointer
          path={[
            { frame: 0.2 * fps, x: 560, y: 330 },
            { frame: 1.0 * fps, x: first.x, y: first.y },
            { frame: 1.65 * fps, x: first.x, y: first.y },
            { frame: 2.0 * fps, x: second.x, y: second.y },
            { frame: 2.8 * fps, x: second.x, y: second.y },
            { frame: 3.6 * fps, x: 520, y: 300 },
          ]}
          clicks={clicks}
          size={20}
        />
      </PageScreen>
    </AbsoluteFill>
  );
};

export const SocialChecklistScene = Interactive.create({ Component: SocialChecklistSceneInner, layout: "absolute-fill" });
