import { AbsoluteFill, Interactive, useVideoConfig } from "remotion";
import { AppWindow } from "../components/AppWindow";
import { Caption } from "../components/Caption";
import { checkboxCenter, PageScreen } from "../components/PageScreen";
import { Pointer } from "../components/Pointer";
import { VIEWS } from "../components/Screen";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { CAPTION, STAGE } from "./layout";

/** A page in the notebook: live Markdown, and two checkboxes ticked with the mouse. */
const ChecklistSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const { fps } = useVideoConfig();
  const text = copy[lang].checklist;
  const first = checkboxCenter(1);
  const second = checkboxCenter(2);
  const clicks = [1.6 * fps, 2.8 * fps];
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <AppWindow width={STAGE.width} style={{ position: "absolute", left: STAGE.left, top: STAGE.top }}>
        <PageScreen lang={lang} width={STAGE.width} view={VIEWS.page} ticks={clicks}>
          <Pointer
            path={[
              { frame: 0.3 * fps, x: 700, y: 400 },
              { frame: 1.4 * fps, x: first.x, y: first.y },
              { frame: 2.2 * fps, x: first.x, y: first.y },
              { frame: 2.65 * fps, x: second.x, y: second.y },
              { frame: 3.6 * fps, x: second.x, y: second.y },
              { frame: 4.6 * fps, x: 640, y: 330 },
            ]}
            clicks={clicks}
          />
        </PageScreen>
      </AppWindow>
    </AbsoluteFill>
  );
};

export const ChecklistScene = Interactive.create({ Component: ChecklistSceneInner, layout: "absolute-fill" });
