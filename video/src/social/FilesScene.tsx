import { AbsoluteFill, Interactive, useVideoConfig } from "remotion";
import { FileTree } from "../components/FileTree";
import { TerminalWindow } from "../components/Terminal";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { STAGE } from "./layout";

const SocialFilesSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].social.files.title} />
      <TerminalWindow width={STAGE.width} height={720} title="bash" fontSize={26} style={{ position: "absolute", left: STAGE.left, top: 560 }}>
        <FileTree lang={lang} fontSize={26} start={0.3 * fps} />
      </TerminalWindow>
    </AbsoluteFill>
  );
};

export const SocialFilesScene = Interactive.create({ Component: SocialFilesSceneInner, layout: "absolute-fill" });
