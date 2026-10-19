// UI strings. Add a language by copying `en` and translating every key.

const en = {
  "quick.placeholder": "What's on your mind?",
  "quick.save": "Save",
  "quick.newline": "New line",
  "quick.close": "Close",
  "quick.saved": "Saved to Inbox",
  "quick.notebook": "Notebook",
  "quick.error": "Could not save. Your text is still here.",
  "nb.search": "Search",
  "nb.inbox": "Inbox",
  "nb.newPage": "New page",
  "nb.newFolder": "New folder",
  "nb.folderName": "Folder name",
  "nb.pageTitle": "Page title",
  "nb.untitled": "Untitled",
  "nb.settings": "Settings",
  "nb.saved": "Saved",
  "nb.saving": "Saving…",
  "nb.rename": "Rename",
  "nb.delete": "Delete",
  "nb.moveTo": "Move to…",
  "nb.open": "Open",
  "nb.deleted": "Moved to trash",
  "nb.undo": "Undo",
  "nb.inboxEmpty": "Inbox zero. Press {key} anywhere to capture an idea.",
  "nb.noResults": "No notes match “{q}”.",
  "nb.emptyTitle": "Nothing open",
  "nb.emptyBody": "Pick a page on the left, or create one with {key}.",
  "nb.rootFolder": "No folder",
  "nb.newFolderOption": "New folder…",
  "nb.cancel": "Cancel",
  "nb.ok": "OK",
  "nb.toggleSidebar": "Toggle sidebar",
  "nb.inboxHint": "Quick notes land here. Move them into a folder or delete them.",
  "set.title": "Settings",
  "set.shortcuts": "Shortcuts",
  "set.quickShortcut": "Quick note",
  "set.notebookShortcut": "Open notebook",
  "set.record": "Press keys…",
  "set.recordHint": "Click, then press the new combination. Use at least one of Ctrl, Alt or ⌘.",
  "set.notesDir": "Notes folder",
  "set.notesDirHint": "Leave empty for the default. Notes are plain .md files.",
  "set.reveal": "Show in file manager",
  "set.language": "Language",
  "set.auto": "Automatic",
  "set.launch": "Start Flashjot when I log in",
  "set.save": "Save",
  "set.saved": "Settings saved",
  "set.problem": "Some settings could not be applied:",
  "set.wayland":
    "On Wayland, global shortcuts may not work. Bind “flashjot --quick” and “flashjot --notebook” in your desktop's keyboard settings instead.",
  "err.generic": "Something went wrong: {e}",
};

type Key = keyof typeof en;

const tr: Record<Key, string> = {
  "quick.placeholder": "Aklında ne var?",
  "quick.save": "Kaydet",
  "quick.newline": "Yeni satır",
  "quick.close": "Kapat",
  "quick.saved": "Gelen kutusuna kaydedildi",
  "quick.notebook": "Defter",
  "quick.error": "Kaydedilemedi. Yazdığın burada duruyor.",
  "nb.search": "Ara",
  "nb.inbox": "Gelen",
  "nb.newPage": "Yeni sayfa",
  "nb.newFolder": "Yeni klasör",
  "nb.folderName": "Klasör adı",
  "nb.pageTitle": "Sayfa başlığı",
  "nb.untitled": "Adsız",
  "nb.settings": "Ayarlar",
  "nb.saved": "Kaydedildi",
  "nb.saving": "Kaydediliyor…",
  "nb.rename": "Yeniden adlandır",
  "nb.delete": "Sil",
  "nb.moveTo": "Taşı…",
  "nb.open": "Aç",
  "nb.deleted": "Çöpe taşındı",
  "nb.undo": "Geri al",
  "nb.inboxEmpty": "Gelen kutusu boş. Bir fikir yakalamak için her yerde {key} tuşlarına bas.",
  "nb.noResults": "“{q}” ile eşleşen not yok.",
  "nb.emptyTitle": "Açık sayfa yok",
  "nb.emptyBody": "Soldan bir sayfa seç ya da {key} ile yenisini oluştur.",
  "nb.rootFolder": "Klasörsüz",
  "nb.newFolderOption": "Yeni klasör…",
  "nb.cancel": "Vazgeç",
  "nb.ok": "Tamam",
  "nb.toggleSidebar": "Kenar çubuğunu aç/kapat",
  "nb.inboxHint": "Hızlı notlar buraya düşer. Bir klasöre taşı ya da sil.",
  "set.title": "Ayarlar",
  "set.shortcuts": "Kısayollar",
  "set.quickShortcut": "Hızlı not",
  "set.notebookShortcut": "Defteri aç",
  "set.record": "Tuşlara bas…",
  "set.recordHint": "Tıkla, sonra yeni kombinasyona bas. En az bir Ctrl, Alt ya da ⌘ kullan.",
  "set.notesDir": "Not klasörü",
  "set.notesDirHint": "Varsayılan için boş bırak. Notlar düz .md dosyalarıdır.",
  "set.reveal": "Dosya yöneticisinde göster",
  "set.language": "Dil",
  "set.auto": "Otomatik",
  "set.launch": "Oturum açtığımda Flashjot'u başlat",
  "set.save": "Kaydet",
  "set.saved": "Ayarlar kaydedildi",
  "set.problem": "Bazı ayarlar uygulanamadı:",
  "set.wayland":
    "Wayland'de global kısayollar çalışmayabilir. Bunun yerine masaüstü klavye ayarlarından “flashjot --quick” ve “flashjot --notebook” komutlarına kısayol ata.",
  "err.generic": "Bir şeyler ters gitti: {e}",
};

const dictionaries = { en, tr } as const;
export type Lang = keyof typeof dictionaries;

function detect(): Lang {
  const nav = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en";
  return nav.startsWith("tr") ? "tr" : "en";
}

let current = $state<Lang>(detect());

export function setLanguage(pref: "auto" | Lang) {
  current = pref === "auto" ? detect() : pref;
  if (typeof document !== "undefined") document.documentElement.lang = current;
}

/** Reactive inside components: re-renders when the language changes. */
export function t(key: Key, vars: Record<string, string> = {}): string {
  let s: string = dictionaries[current][key] ?? en[key];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
  return s;
}
