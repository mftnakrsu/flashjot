# Flashjot video

The product demo, the vertical social cut and the README teaser, made with
[Remotion](https://www.remotion.dev/). Every scene is built on the app's real screenshots
(`../docs-site/public/screenshots`, copied into `public/shots`). Where something moves, it is
redrawn natively on top of the screenshot with the app's own CSS values and fonts: the note typed
into the quick box and the green rule when it is saved, the new card dropping into the Inbox and the
badge count, the "Move to…" dialog, the page appearing in the folder, and the checkboxes being
ticked. The terminal scenes (the build the quick box interrupts, `tree` of the notes folder) are
drawn in the app's writing font.

## What it makes

| Composition | Output (in `out/`) |
| --- | --- |
| `FlashjotDemo-en`, `FlashjotDemo-tr` | `flashjot-demo-<lang>.mp4`: 39.5 s, 1920×1080, 30 fps, H.264, no audio |
| (stills of the same, frame 363) | `flashjot-demo-<lang>-poster.png` |
| `FlashjotSocial-en`, `FlashjotSocial-tr` | `flashjot-social-<lang>.mp4`: 23 s, 1080×1920, 30 fps, H.264, no audio |
| (stills of the same, frame 45) | `flashjot-social-<lang>-poster.png` |
| `FlashjotTeaser` | `flashjot-teaser.gif`: 8 s loop, 960×540, 15 fps |
| (from `src/captions.ts`) | `flashjot-{demo,social}-<lang>.{srt,vtt,json}` |
| `FlashjotDemo-<lang>`, `FlashjotSocial-<lang>` with voiceover and music | `flashjot-{demo,social}-<lang>-voiced.mp4`: the same with an AAC audio track (`npm run render:voiced`) |

`<lang>` is `en` or `tr`. Both videos show real content from the first frame: the demo opens on
the name and the promise, the social cut on its headline with the quick box already open.

The scenes of both videos are also registered on their own (folders _Scenes_ and _Social-scenes_
in the Studio) for previewing. _Dev/Calibration_ draws a redrawn screen at the screenshot's own
size, so a still of it can be compared with the screenshot pixel by pixel when the screenshots
change.

## Words, captions and audio

- Every word on screen lives in `src/i18n.ts`, one dictionary per language. Labels that also
  appear in the app match its wording (`../src/lib/i18n.svelte.ts`).
- The subtitles are one timed script per video and language in `src/captions.ts` (start and end in
  ms). They are burned into the videos and exported as `.srt` and `.vtt` next to the renders
  (`npm run captions`), so a voiceover can be generated from exactly the same lines.
- The plain renders are silent. `FlashjotDemo` and `FlashjotSocial` take optional props
  `musicSrc`, `musicVolume`, `musicDuckedVolume`, `voiceoverSrc`, `voiceoverClips` and
  `voiceoverVolume` (a file or folder in `public/`, or a URL); when set, `<Audio>` tracks are added
  (`src/components/Soundtrack.tsx`). `captions: false` turns the burned-in subtitles off.
- The voiced renders (`npm run render:voiced`, not part of `npm run render`) use one voiceover clip
  per caption cue, `public/audio/voiceover/flashjot-<video>-<lang>/01.wav`, `02.wav`, …, each
  played from the start of its cue and cut at its end, so the voice follows `src/captions.ts`. The
  clips are made from the exported `.json` cues by a separate voiceover script that is not in this repository
  (Chatterbox Multilingual with one fixed voice; best of several takes, checked with
  Whisper, trimmed, -16 LUFS). A cue's optional `say` is what the voice reads instead of the
  subtitle (e.g. "Control Alt En'e" for "Ctrl+Alt+N'ye"), only a respelling: the voice says the same words as the subtitle. Every cue
  is voiced, and each clip fits inside its cue; a line too long for that is shortened in `text`. After changing a line, re-export the
  captions, regenerate its clip and check that it still fits its cue.
- The music of the voiced renders is the `MUSIC` constant in `scripts/render.mjs` (files in
  `public/audio/`, CC0): 0.5 between lines, ducked to 0.25 under the voice, faded in over 0.5 s and
  out over the last 1.5 s.

## Commands

```bash
npm install
npm run dev              # Remotion Studio, to preview and tweak scenes
npm run render           # captions, both videos in both languages, posters, teaser → out/
npm run render:demo:en   # or render:demo:tr, render:demo, render:social(:en|:tr), render:posters, render:teaser
npm run captions         # only the .srt/.vtt/.json files
npm run render:voiced    # the four videos with voiceover and music → out/*-voiced.mp4
npm run publish          # copies the demo videos and posters to ../docs-site/public/media, the GIF to ../docs/media
npm run lint             # eslint and tsc
```

`npm run render` never writes outside `out/`; copying into the docs is the separate `publish`
step. Each render uses `FLASHJOT_CONCURRENCY` browser tabs (default 4). The caption export imports
`src/captions.ts` directly, which needs Node 22.18 or newer.

## Refreshing the screenshots

1. Capture new screenshots for the docs site (`../docs-site/public/screenshots`).
2. Here, run `npm run shots` (`scripts/prepare-shots.py`). It copies them into `public/shots`.
3. The redrawn parts are placed with positions measured on these files (constants at the top of
   `src/components/InboxScreen.tsx`, `PageScreen.tsx` and `QuickBox.tsx`). If the layout of the
   app changed, check them with the _Calibration_ composition.

The Turkish quick box and Move dialog screenshots contain garbled text from the capture tool; the
video covers that text and types its own, so only their frames are used.

## License

The code is MIT like the rest of Flashjot. Remotion itself has its own license: free for
individuals and companies of up to three people; see
[remotion.pro/license](https://www.remotion.pro/license). Atkinson Hyperlegible Next and iA Writer
Quattro (`public/fonts`) are under the SIL Open Font License.
