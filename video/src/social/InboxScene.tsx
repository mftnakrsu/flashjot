import { AbsoluteFill, Interactive, useVideoConfig } from "remotion";
import { InboxScreen } from "../components/InboxScreen";
import { copy, type Lang } from "../i18n";
import { colors } from "../theme";
import { Headline } from "./Headline";
import { framed, STAGE } from "./layout";

/** Close on the Inbox list: the new card drops in on top. */
const SocialInboxSceneInner = ({ lang }: { readonly lang: Lang }) => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: colors.page }}>
      <Headline title={copy[lang].social.inbox.title} />
      <InboxScreen
        lang={lang}
        width={STAGE.width}
        view={{ x: 285, y: 30, width: 610, height: 420 }}
        timing={{ arrive: 0.6 * fps }}
        style={{ ...framed, position: "absolute", left: STAGE.left, top: 560 }}
      />
    </AbsoluteFill>
  );
};

export const SocialInboxScene = Interactive.create({ Component: SocialInboxSceneInner, layout: "absolute-fill" });
