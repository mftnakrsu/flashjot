import { Composition, Folder } from "remotion";
import { Calibration } from "./Calibration";
import { FlashjotDemo } from "./FlashjotDemo";
import { FlashjotSocial } from "./FlashjotSocial";
import { FlashjotTeaser } from "./FlashjotTeaser";
import { CaptureScene } from "./scenes/CaptureScene";
import { ChecklistScene } from "./scenes/ChecklistScene";
import { EverywhereScene } from "./scenes/EverywhereScene";
import { FilesScene } from "./scenes/FilesScene";
import { InboxScene } from "./scenes/InboxScene";
import { MoveScene } from "./scenes/MoveScene";
import { OpeningScene } from "./scenes/OpeningScene";
import { OutroScene } from "./scenes/OutroScene";
import { SocialChecklistScene } from "./social/ChecklistScene";
import { SocialFilesScene } from "./social/FilesScene";
import { SocialHookScene } from "./social/HookScene";
import { SocialInboxScene } from "./social/InboxScene";
import { SocialMoveScene } from "./social/MoveScene";
import { SocialOutroScene } from "./social/OutroScene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Demo">
        <Composition id="FlashjotDemo-en" component={FlashjotDemo} durationInFrames={1185} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="FlashjotDemo-tr" component={FlashjotDemo} durationInFrames={1185} fps={30} width={1920} height={1080} defaultProps={{ lang: "tr" }} />
        <Composition id="FlashjotTeaser" component={FlashjotTeaser} durationInFrames={240} fps={30} width={1920} height={1080} />
      </Folder>
      <Folder name="Social">
        <Composition id="FlashjotSocial-en" component={FlashjotSocial} durationInFrames={690} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="FlashjotSocial-tr" component={FlashjotSocial} durationInFrames={690} fps={30} width={1080} height={1920} defaultProps={{ lang: "tr" }} />
      </Folder>
      <Folder name="Scenes">
        <Composition id="Opening" component={OpeningScene} durationInFrames={105} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Capture" component={CaptureScene} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Inbox" component={InboxScene} durationInFrames={180} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Move" component={MoveScene} durationInFrames={195} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Checklist" component={ChecklistScene} durationInFrames={165} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Files" component={FilesScene} durationInFrames={165} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Everywhere" component={EverywhereScene} durationInFrames={135} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
        <Composition id="Outro" component={OutroScene} durationInFrames={135} fps={30} width={1920} height={1080} defaultProps={{ lang: "en" }} />
      </Folder>
      <Folder name="Social-scenes">
        <Composition id="SocialHook" component={SocialHookScene} durationInFrames={135} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="SocialInbox" component={SocialInboxScene} durationInFrames={135} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="SocialMove" component={SocialMoveScene} durationInFrames={150} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="SocialChecklist" component={SocialChecklistScene} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="SocialFiles" component={SocialFilesScene} durationInFrames={120} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
        <Composition id="SocialOutro" component={SocialOutroScene} durationInFrames={105} fps={30} width={1080} height={1920} defaultProps={{ lang: "en" }} />
      </Folder>
      <Folder name="Dev">
        <Composition id="Calibration" component={Calibration} durationInFrames={120} fps={30} width={2160} height={1350} defaultProps={{ which: "inbox", lang: "en" }} />
      </Folder>
    </>
  );
};
