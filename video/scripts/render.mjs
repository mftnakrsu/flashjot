#!/usr/bin/env node
/**
 * Renders the Flashjot videos, their posters and subtitle files into out/:
 *
 *   node scripts/render.mjs [all | demo | demo-en | demo-tr | social | social-en | social-tr | posters | teaser | captions
 *                            | voiced | demo-voiced-en | demo-voiced-tr | social-voiced-en | social-voiced-tr | publish] ...
 *
 *   out/flashjot-demo-<lang>.mp4         1920×1080, 30 fps, H.264, no audio track
 *   out/flashjot-demo-<lang>-poster.png
 *   out/flashjot-social-<lang>.mp4       1080×1920, 30 fps, H.264, no audio track
 *   out/flashjot-social-<lang>-poster.png
 *   out/flashjot-teaser.gif              960×540, 15 fps
 *   out/flashjot-{demo,social}-<lang>.{srt,vtt,json}   the burned-in subtitles, for a voiceover
 *
 * and, only when asked for (`voiced`, `demo-voiced-<lang>`, `social-voiced-<lang>`; not part of `all`):
 *
 *   out/flashjot-{demo,social}-<lang>-voiced.mp4   the same with voiceover and music, AAC audio
 *
 * The voiced renders need the voiceover clips in public/audio/voiceover/flashjot-<video>-<lang>/
 * (one per caption cue, made from the .json files by a voiceover script that is not in this repo) and the
 * music in public/audio/ (MUSIC below).
 *
 * Nothing outside out/ is touched, except by `publish`, which is never part of `all`: it copies
 * the demo videos and posters to ../docs-site/public/media and the GIF to ../docs/media.
 *
 * The project is bundled once, then each output is rendered in turn. Browser tabs per render:
 * FLASHJOT_CONCURRENCY (default 4).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const video = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repo = resolve(video, "..");
const out = join(video, "out");
const bundle = join(out, "bundle");
const siteMedia = join(repo, "docs-site", "public", "media");
const docsMedia = join(repo, "docs", "media");

const LANGS = ["en", "tr"];
const CONCURRENCY = process.env.FLASHJOT_CONCURRENCY ?? "4";
/**
 * Background music of the voiced renders, a file in public/. Both are CC0 (Loyalty Freak Music, see
 * public/audio/LICENSES.md). To use another track, copy it into public/audio/ and change it here.
 */
const MUSIC = {
  demo: "audio/02_LoyaltyFreakMusic_Static-Shoes_CC0.mp3",
  social: "audio/06_LoyaltyFreakMusic_Sweet-Sun_CC0.mp3",
};
/** Representative frames: the note just filed into its folder, and the hook while typing. */
const DEMO_POSTER_FRAME = 363;
const SOCIAL_POSTER_FRAME = 45;

const run = (command, args) => {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd: video, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
};
const remotion = (...args) => run("npx", ["remotion", ...args]);

const copy = (file, ...directories) => {
  for (const directory of directories) {
    mkdirSync(directory, { recursive: true });
    copyFileSync(join(out, file), join(directory, file));
    console.log(`copied out/${file} → ${directory}`);
  }
};

const render = (id, file, ...flags) => remotion("render", bundle, id, join(out, file), `--concurrency=${CONCURRENCY}`, ...flags);
/**
 * H.264, yuv420p tagged as BT.709, no audio track. Frames are captured as PNG: from JPEG frames
 * the encoder would fall back to full-range yuvj420p and the colours would drift.
 */
const h264 = (crf) => ["--codec=h264", `--crf=${crf}`, "--image-format=png", "--pixel-format=yuv420p", "--color-space=bt709", "--muted"];
/** The same encoding with an AAC audio track: voiceover clips and music, ducked under the voice. */
const voiced = (video, lang) => [
  ...h264(20).filter((flag) => flag !== "--muted"),
  "--audio-codec=aac",
  "--audio-bitrate=192k",
  `--props=${JSON.stringify({ musicSrc: MUSIC[video], musicVolume: 0.5, musicDuckedVolume: 0.25, voiceoverClips: `audio/voiceover/flashjot-${video}-${lang}` })}`,
];
const still = (id, file, frame) => remotion("still", bundle, id, join(out, file), `--frame=${frame}`, "--image-format=png");

const jobs = {
  "demo-en": () => render("FlashjotDemo-en", "flashjot-demo-en.mp4", ...h264(20)),
  "demo-tr": () => render("FlashjotDemo-tr", "flashjot-demo-tr.mp4", ...h264(20)),
  "social-en": () => render("FlashjotSocial-en", "flashjot-social-en.mp4", ...h264(20)),
  "social-tr": () => render("FlashjotSocial-tr", "flashjot-social-tr.mp4", ...h264(20)),
  "demo-voiced-en": () => render("FlashjotDemo-en", "flashjot-demo-en-voiced.mp4", ...voiced("demo", "en")),
  "demo-voiced-tr": () => render("FlashjotDemo-tr", "flashjot-demo-tr-voiced.mp4", ...voiced("demo", "tr")),
  "social-voiced-en": () => render("FlashjotSocial-en", "flashjot-social-en-voiced.mp4", ...voiced("social", "en")),
  "social-voiced-tr": () => render("FlashjotSocial-tr", "flashjot-social-tr-voiced.mp4", ...voiced("social", "tr")),
  posters: () => {
    for (const lang of LANGS) {
      still(`FlashjotDemo-${lang}`, `flashjot-demo-${lang}-poster.png`, DEMO_POSTER_FRAME);
      still(`FlashjotSocial-${lang}`, `flashjot-social-${lang}-poster.png`, SOCIAL_POSTER_FRAME);
    }
  },
  teaser: () => render("FlashjotTeaser", "flashjot-teaser.gif", "--codec=gif", "--every-nth-frame=2", "--scale=0.5"),
  captions: () => run("node", [join(video, "scripts", "export-captions.mjs"), out]),
  publish: () => {
    for (const lang of LANGS) copy(`flashjot-demo-${lang}.mp4`, siteMedia);
    for (const lang of LANGS) copy(`flashjot-demo-${lang}-poster.png`, siteMedia);
    copy("flashjot-teaser.gif", docsMedia);
  },
};
jobs.demo = () => {
  jobs["demo-en"]();
  jobs["demo-tr"]();
};
jobs.social = () => {
  jobs["social-en"]();
  jobs["social-tr"]();
};
jobs.voiced = () => {
  for (const lang of LANGS) jobs[`demo-voiced-${lang}`]();
  for (const lang of LANGS) jobs[`social-voiced-${lang}`]();
};
jobs.all = () => {
  jobs.captions();
  jobs.demo();
  jobs.social();
  jobs.posters();
  jobs.teaser();
};

const requested = process.argv.slice(2);
const unknown = requested.filter((name) => !(name in jobs));
if (unknown.length > 0) {
  console.error(`Unknown job: ${unknown.join(", ")}. Use: ${Object.keys(jobs).join(", ")}`);
  process.exit(1);
}

const names = requested.length > 0 ? requested : ["all"];
if (names.some((name) => name !== "captions" && name !== "publish")) remotion("bundle", `--out-dir=${bundle}`);
for (const name of names) jobs[name]();
