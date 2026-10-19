// Typed wrappers around the Rust commands in src-tauri/src/commands.rs.
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface NoteMeta {
  path: string;
  title: string;
  folder: string;
  modified: number;
  preview: string;
}

export interface Folder {
  name: string;
  pages: NoteMeta[];
}

export interface Tree {
  folders: Folder[];
  root_pages: NoteMeta[];
}

export interface Hit {
  path: string;
  title: string;
  snippet: string;
}

export interface Settings {
  notesDir: string | null;
  quickShortcut: string;
  notebookShortcut: string;
  language: "auto" | "en" | "tr";
  launchAtLogin: boolean;
}

export const INBOX = "Inbox";

export const addQuickNote = (text: string) => invoke<NoteMeta>("add_quick_note", { text });
export const listInbox = () => invoke<NoteMeta[]>("list_inbox");
export const getTree = () => invoke<Tree>("get_tree");
export const readNote = (path: string) => invoke<string>("read_note", { path });
export const writeNote = (path: string, content: string) => invoke<void>("write_note", { path, content });
export const createFolder = (name: string) => invoke<void>("create_folder", { name });
export const createPage = (folder: string, title: string) => invoke<NoteMeta>("create_page", { folder, title });
export const renameNote = (path: string, title: string) => invoke<NoteMeta>("rename_note", { path, title });
export const moveNote = (path: string, folder: string) => invoke<NoteMeta>("move_note", { path, folder });
export const trashNote = (path: string) => invoke<string>("trash_note", { path });
export const restoreNote = (trashPath: string, originalPath: string) =>
  invoke<void>("restore_note", { trashPath, originalPath });
export const searchNotes = (query: string) => invoke<Hit[]>("search_notes", { query });
export const getSettings = () => invoke<Settings>("get_settings");
/** Returns problems such as a shortcut already taken; empty when all is well. */
export const setSettings = (settings: Settings) => invoke<string[]>("set_settings", { settings });
export const notesDir = () => invoke<string>("notes_dir");
export const revealNotesDir = () => invoke<void>("reveal_notes_dir");
export const hideWindow = () => invoke<void>("hide_window");
export const openNotebook = (path?: string) => invoke<void>("open_notebook", { path });

export const onNotesChanged = (cb: () => void): Promise<UnlistenFn> => listen("notes-changed", cb);

export const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent);

/** "CommandOrControl+Alt+N" → "⌘⌥N" on macOS, "Ctrl+Alt+N" elsewhere. */
export function prettyShortcut(accel: string): string {
  const parts = accel.split("+").map((p) => p.trim());
  const mac: Record<string, string> = {
    CommandOrControl: "⌘", Command: "⌘", Super: "⌘", Control: "⌃", Ctrl: "⌃", Alt: "⌥", Option: "⌥", Shift: "⇧",
  };
  const other: Record<string, string> = { CommandOrControl: "Ctrl", Control: "Ctrl", Command: "Super" };
  return isMac
    ? parts.map((p) => mac[p] ?? p).join("")
    : parts.map((p) => other[p] ?? p).join("+");
}
