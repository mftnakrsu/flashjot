import { AbsoluteFill, Interactive, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { FileTree } from "../components/FileTree";
import { TerminalWindow } from "../components/Terminal";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { CAPTION, STAGE } from "./layout";

/** `tree` in the notes folder: folders, pages and the Inbox are plain .md files. */
const FilesSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const { fps } = useVideoConfig();
  const text = copy[lang].files;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Caption title={text.title} body={text.body} style={{ position: "absolute", left: CAPTION.left, top: CAPTION.top, width: CAPTION.width }} />
      <TerminalWindow
        width={STAGE.width}
        height={700}
        title="bash"
        fontSize={27}
        style={{ position: "absolute", left: STAGE.left, top: STAGE.top - 10 }}
      >
        <FileTree lang={lang} fontSize={27} start={0.6 * fps} />
      </TerminalWindow>
    </AbsoluteFill>
  );
};

export const FilesScene = Interactive.create({ Component: FilesSceneInner, layout: "absolute-fill" });
