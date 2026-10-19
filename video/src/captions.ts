/**
 * The subtitle script of the demo and the social video, per language: what is said while each
 * part plays. It is burned into the videos (components/Subtitles.tsx) and exported as .srt and
 * .vtt by scripts/export-captions.mjs, so a voiceover can be generated from the same lines.
 *
 * Times are in milliseconds from the start of the composition. Keep each line short (one line on
 * the 16:9 demo, at most two on the 9:16 video) and leave a small gap between cues.
 *
 * This file is also imported by Node directly (type stripping), so it may only use erasable
 * TypeScript: type-only imports, no enums.
 */
import type { Lang } from "./i18n";

export type Cue = {
  readonly startMs: number;
  readonly endMs: number;
  readonly text: string;
  /**
   * What the voiceover says instead of `text`, when the subtitle would be read wrong by the
   * text-to-speech voice (shortcuts, file names, web addresses, "N'ye" read as "niye"). Only the
   * voiceover uses it; the subtitles always show `text`. It is only a respelling: the voice says
   * the same words as the subtitle. A line too long to fit its cue when spoken is shortened in
   * `text` itself. Ellipses are dropped from either.
   */
  readonly say?: string;
};

export type CaptionScript = {
  /** Length of the composition the cues belong to. */
  readonly durationMs: number;
  /** Output file name without extension and language, e.g. flashjot-demo → flashjot-demo-en.srt. */
  readonly file: string;
  readonly cues: Record<Lang, readonly Cue[]>;
};

/**
 * FlashjotDemo, 39.5 s. Scenes (with their 0.5 s fades): Opening 0–3.5, Capture 3–10,
 * Inbox 9.5–15.5, Move 15–21.5, Checklist 21–26.5, Files 26–31.5, Everywhere 31–35.5, Outro 35–39.5.
 * Key moments: Ctrl+Alt+N at 3.6, typing 4.5–7, Enter 7.5; Ctrl+Alt+D at 9.9, the card lands at
 * 10.7; M at 15.6, Enter 17.9; clicks at 22.6 and 23.8; `tree` at 26.6.
 */
const demo: CaptionScript = {
  durationMs: 39500,
  file: "flashjot-demo",
  cues: {
    en: [
      { startMs: 300, endMs: 3100, text: "Ideas show up at bad times. Flashjot catches them." },
      { startMs: 3300, endMs: 5500, text: "In the middle of a build, press Ctrl+Alt+N.", say: "In the middle of a build, press Control Alt N." },
      { startMs: 5600, endMs: 7400, text: "A small box opens. Type…", say: "A small box opens. Type." },
      { startMs: 7500, endMs: 9600, text: "…press Enter, and you're back to work." },
      { startMs: 9900, endMs: 12300, text: "Later, Ctrl+Alt+D opens the notebook.", say: "Later, Control Alt D opens the notebook." },
      { startMs: 12400, endMs: 15100, text: "The note is waiting in the Inbox." },
      { startMs: 15400, endMs: 17800, text: "Press M and type a few letters." },
      { startMs: 17900, endMs: 21200, text: "Enter files it, named after its first line." },
      { startMs: 21400, endMs: 23700, text: "Pages are Markdown with live styling…" },
      { startMs: 23800, endMs: 26200, text: "…and checkboxes you tick with a click." },
      { startMs: 26500, endMs: 28900, text: "Every note is a plain .md file.", say: "Every note is a plain dot M D file." },
      { startMs: 29000, endMs: 31200, text: "Open it anywhere, keep it in git." },
      { startMs: 31400, endMs: 35000, text: "Linux, Windows and Mac. Light and dark, English and Turkish." },
      { startMs: 35400, endMs: 39200, text: "Flashjot is free and open source. Get it at flashjot.mefby.com.", say: "Flashjot is free and open source. Get it at flashjot dot mefby dot com." },
    ],
    tr: [
      { startMs: 300, endMs: 3100, text: "Fikirler ansızın gelir. Flashjot yakalar.", say: "Fikirler ansızın gelir. Flaşcot yakalar." },
      { startMs: 3300, endMs: 5500, text: "Derlemenin ortasında Ctrl+Alt+N'ye bas.", say: "Derlemenin ortasında Kontrol Alt En'e bas." },
      { startMs: 5600, endMs: 7400, text: "Bir kutu açılır, fikrini yaz…", say: "Bir kutu açılır, fikrini yaz." },
      { startMs: 7500, endMs: 9600, text: "…Enter'a bas ve işine dön." },
      { startMs: 9900, endMs: 12300, text: "Sonra Ctrl+Alt+D ile defteri aç.", say: "Sonra Kontrol Alt Di ile defteri aç." },
      { startMs: 12400, endMs: 15100, text: "Notun Gelen kutusunda seni bekliyor." },
      { startMs: 15400, endMs: 17800, text: "M'ye bas, klasör adını yaz.", say: "Em'e bas, klasör adını yaz." },
      { startMs: 17900, endMs: 21200, text: "Enter ile taşınır; adını ilk satırından alır." },
      { startMs: 21400, endMs: 23700, text: "Sayfalar canlı biçimlenen Markdown…" },
      { startMs: 23800, endMs: 26200, text: "…kutucuklar tek tıkla işaretlenir." },
      { startMs: 26500, endMs: 28900, text: "Her not düz bir .md dosyasıdır.", say: "Her not düz bir em de dosyasıdır." },
      { startMs: 29000, endMs: 31200, text: "Editörde aç, git'te tut." },
      { startMs: 31400, endMs: 35000, text: "Linux, Windows ve macOS'te, Türkçe ve İngilizce.", say: "Linux, Windows ve Mak O Es'te, Türkçe ve İngilizce." },
      { startMs: 35400, endMs: 39200, text: "Ücretsiz ve açık kaynak. flashjot.mefby.com", say: "Ücretsiz ve açık kaynak. Flaşcot nokta mefbi nokta kom." },
    ],
  },
};

/**
 * FlashjotSocial, 23 s. Scenes (with their 0.5 s fades): Hook 0–4.5, Inbox 4–8.5, Move 8–13,
 * Checklist 12.5–16.5, Files 16–20, Outro 19.5–23.
 * Key moments: typing 0.4–2.1, Enter 2.5; the card lands at 4.9; Enter in "Move to…" at 10.5.
 */
const social: CaptionScript = {
  durationMs: 23000,
  file: "flashjot-social",
  cues: {
    en: [
      { startMs: 200, endMs: 2300, text: "Press Ctrl+Alt+N anywhere and type.", say: "Press Control Alt N anywhere and type." },
      { startMs: 2400, endMs: 4300, text: "Enter saves it. Back to work." },
      { startMs: 4500, endMs: 8300, text: "The note waits in your Inbox as a plain Markdown file." },
      { startMs: 8500, endMs: 10400, text: "Press M and type a folder…" },
      { startMs: 10500, endMs: 12800, text: "…it's filed and named after its first line." },
      { startMs: 13000, endMs: 16300, text: "Pages have checkboxes you tick with a click." },
      { startMs: 16500, endMs: 19800, text: "Every note is a .md file. Use any editor, or git.", say: "Every note is a dot M D file. Use any editor, or git." },
      { startMs: 19900, endMs: 22900, text: "Free and open source, for Linux, Windows and Mac." },
    ],
    tr: [
      { startMs: 200, endMs: 2300, text: "Ctrl+Alt+N'ye bas ve yaz.", say: "Kontrol Alt En'e bas ve yaz." },
      { startMs: 2400, endMs: 4300, text: "Enter kaydeder. İşine dön." },
      { startMs: 4500, endMs: 8300, text: "Not, Gelen kutusunda düz bir Markdown dosyası olarak bekler." },
      { startMs: 8500, endMs: 10400, text: "M'ye bas, klasör adını yaz…", say: "Em'e bas, klasör adını yaz." },
      { startMs: 10500, endMs: 12800, text: "…taşınır, adını ilk satırından alır." },
      { startMs: 13000, endMs: 16300, text: "Sayfalardaki kutucuklar tek tıkla işaretlenir." },
      { startMs: 16500, endMs: 19800, text: "Her not bir .md dosyası. Editörde ya da git'te aç.", say: "Her not bir em de dosyası. Editörde ya da git'te aç." },
      { startMs: 19900, endMs: 22900, text: "Ücretsiz ve açık kaynak; Linux, Windows, Mac.", say: "Ücretsiz ve açık kaynak; Linux, Windows, Mak." },
    ],
  },
};

export const captionScripts = { demo, social } as const;
