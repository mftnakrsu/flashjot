/**
 * Every word on screen, per language. Labels that also appear in the app match its wording
 * (src/lib/i18n.svelte.ts in the repo); the sample notes match the screenshots.
 */
export type Lang = "en" | "tr";

type Scene = { readonly title: string; readonly body?: string };

type Copy = {
  readonly opening: { readonly tagline: string };
  /** The macOS keys, under the key caps of the global shortcuts. */
  readonly mac: { readonly quick: string; readonly notebook: string };
  readonly capture: Scene;
  readonly inbox: Scene;
  readonly move: Scene;
  readonly checklist: Scene;
  readonly files: Scene;
  readonly everywhere: Scene & { readonly systems: readonly string[]; readonly extras: readonly string[] };
  readonly outro: { readonly site: string; readonly code: string; readonly license: string };
  readonly social: {
    readonly hook: Scene;
    readonly inbox: Scene;
    readonly move: Scene;
    readonly checklist: Scene;
    readonly files: Scene;
    readonly outro: { readonly tagline: string; readonly systems: string };
  };
  /** Strings of the app itself, as its UI shows them. */
  readonly app: {
    readonly placeholder: string;
    readonly savedToInbox: string;
    readonly moveTo: string;
    readonly newFolderOption: string;
    readonly rootFolder: string;
    readonly notebook: string;
    readonly saving: string;
  };
  /** The note captured in the video, and where it goes. */
  readonly note: {
    readonly text: string;
    /** How the Inbox card dates it. */
    readonly date: string;
    readonly folders: readonly [string, string];
    /** What is typed into "Move to…". */
    readonly query: string;
    /** Where the new page lands among the folder's pages (they are sorted by title). */
    readonly insertAt: number;
  };
  /** The notes folder as `tree` prints it after the move. */
  readonly tree: {
    /** The folder the terminal is in; `tree` is run there. */
    readonly cwd: string;
    /** Tag on the page that was just filed. */
    readonly newLabel: string;
    readonly entries: readonly { readonly name: string; readonly depth: number; readonly last: boolean; readonly isNew?: boolean }[];
  };
};

const en: Copy = {
  opening: { tagline: "Write the idea down before it's gone" },
  mac: { quick: "⌘ ⌥ N on macOS", notebook: "⌘ ⌥ D on macOS" },
  capture: {
    title: "One shortcut, anywhere",
    body: "A small box opens on top of whatever you are doing. Type, press Enter, back to work.",
  },
  inbox: {
    title: "It lands in the Inbox",
    body: "Quick notes wait here as cards until you have time to sort them.",
  },
  move: {
    title: "File it with one key",
    body: "Press M, type a few letters of a folder, press Enter. The page is named after the first line.",
  },
  checklist: {
    title: "A notebook for the rest",
    body: "Folders and pages with live Markdown and checkboxes you can click. Ctrl+K searches everything.",
  },
  files: {
    title: "Just plain files",
    body: "Every note is a .md file in Documents/Flashjot. Open it in any editor, or keep it in git.",
  },
  everywhere: {
    title: "Runs where you work",
    body: "Light and dark themes follow your system. The interface is in English and Turkish.",
    systems: ["Linux", "Windows", "macOS"],
    extras: ["Free", "Open source", "MIT"],
  },
  outro: { site: "Website", code: "Code", license: "Free and open source, MIT licensed" },
  social: {
    hook: { title: "Write the idea down before it's gone." },
    inbox: { title: "It lands in your Inbox" },
    move: { title: "Press M to file it" },
    checklist: { title: "Tick it off later" },
    files: { title: "Just plain .md files" },
    outro: { tagline: "Free and open source", systems: "Linux · Windows · macOS" },
  },
  app: {
    placeholder: "What's on your mind?",
    savedToInbox: "Saved to Inbox",
    moveTo: "Move to…",
    newFolderOption: "New folder…",
    rootFolder: "No folder",
    notebook: "Notebook",
    saving: "Saving…",
  },
  note: {
    text: "Try a belt drive for the shoulder joint",
    date: "Today 2:32 PM",
    folders: ["Ideas", "Work"],
    query: "Ide",
    insertAt: 3,
  },
  tree: {
    cwd: "~/Documents/Flashjot",
    newLabel: "new",
    entries: [
      { name: "Ideas", depth: 0, last: false },
      { name: "Motor drivers.md", depth: 1, last: false },
      { name: "Reading list.md", depth: 1, last: false },
      { name: "Robot arm.md", depth: 1, last: false },
      { name: "Try a belt drive for the shoulder joint.md", depth: 1, last: true, isNew: true },
      { name: "Inbox", depth: 0, last: false },
      { name: "2026-10-18-201104.md", depth: 1, last: false },
      { name: "2026-10-19-091208.md", depth: 1, last: false },
      { name: "2026-10-19-121503.md", depth: 1, last: true },
      { name: "Work", depth: 0, last: true },
      { name: "Release checklist.md", depth: 1, last: false },
      { name: "Weekly sync.md", depth: 1, last: true },
    ],
  },
};

const tr: Copy = {
  opening: { tagline: "Fikir kaybolmadan yaz" },
  mac: { quick: "macOS'te ⌘ ⌥ N", notebook: "macOS'te ⌘ ⌥ D" },
  capture: {
    title: "Tek kısayol, her yerde",
    body: "Ne yapıyorsan onun üstünde küçük bir kutu açılır. Yaz, Enter'a bas, işine dön.",
  },
  inbox: {
    title: "Gelen kutusuna düşer",
    body: "Hızlı notlar, düzenlemeye vaktin olana kadar burada kart olarak bekler.",
  },
  move: {
    title: "Tek tuşla klasöre taşı",
    body: "M'ye bas, klasör adından birkaç harf yaz, Enter'a bas. Sayfa adını ilk satırdan alır.",
  },
  checklist: {
    title: "Gerisi için bir defter",
    body: "Klasörler, canlı Markdown sayfaları ve tıklanabilir kutucuklar. Ctrl+K her şeyde arar.",
  },
  files: {
    title: "Sadece düz dosyalar",
    body: "Her not, Belgeler/Flashjot içinde bir .md dosyası. İstediğin editörde aç ya da git'te tut.",
  },
  everywhere: {
    title: "Nerede çalışıyorsan orada",
    body: "Açık ve koyu tema sistemine uyar. Arayüz Türkçe ve İngilizce.",
    systems: ["Linux", "Windows", "macOS"],
    extras: ["Ücretsiz", "Açık kaynak", "MIT"],
  },
  outro: { site: "Web sitesi", code: "Kaynak kodu", license: "Ücretsiz ve açık kaynak, MIT lisanslı" },
  social: {
    hook: { title: "Fikir kaybolmadan yaz." },
    inbox: { title: "Gelen kutusuna düşer" },
    move: { title: "M ile klasöre taşı" },
    checklist: { title: "Sonra işaretle" },
    files: { title: "Sadece düz .md dosyaları" },
    outro: { tagline: "Ücretsiz ve açık kaynak", systems: "Linux · Windows · macOS" },
  },
  app: {
    placeholder: "Aklında ne var?",
    savedToInbox: "Gelen kutusuna kaydedildi",
    moveTo: "Taşı…",
    newFolderOption: "Yeni klasör…",
    rootFolder: "Klasörsüz",
    notebook: "Defter",
    saving: "Kaydediliyor…",
  },
  note: {
    text: "Omuz eklemi için kayışlı tahrik dene",
    date: "Bugün 14:32",
    folders: ["Fikirler", "İş"],
    query: "Fik",
    insertAt: 2,
  },
  tree: {
    cwd: "~/Belgeler/Flashjot",
    newLabel: "yeni",
    entries: [
      { name: "Fikirler", depth: 0, last: false },
      { name: "Motor sürücüleri.md", depth: 1, last: false },
      { name: "Okuma listesi.md", depth: 1, last: false },
      { name: "Omuz eklemi için kayışlı tahrik dene.md", depth: 1, last: false, isNew: true },
      { name: "Robot kol.md", depth: 1, last: true },
      { name: "Inbox", depth: 0, last: false },
      { name: "2026-10-18-201104.md", depth: 1, last: false },
      { name: "2026-10-19-091208.md", depth: 1, last: false },
      { name: "2026-10-19-121503.md", depth: 1, last: true },
      { name: "İş", depth: 0, last: true },
      { name: "Haftalık toplantı.md", depth: 1, last: false },
      { name: "Sürüm listesi.md", depth: 1, last: true },
    ],
  },
};

export const copy: Record<Lang, Copy> = { en, tr };
