// Notebook window state shared by its components.
import * as api from "$lib/api";
import type { Hit, NoteMeta, Tree } from "$lib/api";
import { lang as uiLang, t } from "$lib/i18n.svelte";

export type View =
  | { kind: "inbox" }
  | { kind: "page"; path: string }
  | { kind: "settings" }
  | { kind: "empty" };

export interface Toast {
  id: number;
  message: string;
  tone: "info" | "error";
  action?: { label: string; run: () => void | Promise<void> };
}

export type Dialog =
  | { kind: "prompt"; title: string; value: string; submit: (value: string) => void }
  | { kind: "move"; path: string }
  | null;

class Notebook {
  tree = $state<Tree>({ folders: [], root_pages: [] });
  inbox = $state<NoteMeta[]>([]);
  view = $state<View>({ kind: "inbox" });
  query = $state("");
  results = $state<Hit[]>([]);
  sidebarOpen = $state(true);
  toast = $state<Toast | null>(null);
  dialog = $state<Dialog>(null);
  /** Bumped to ask the page title field to take focus and select its text. */
  focusTitle = $state(0);
  /** Set by the editor; flushes pending autosave before the open page changes. */
  flush: () => Promise<void> = async () => {};

  folderNames = $derived(this.tree.folders.map((f) => f.name));

  async refresh() {
    try {
      const [tree, inbox] = await Promise.all([api.getTree(), api.listInbox()]);
      this.tree = tree;
      this.inbox = inbox;
      if (this.query.trim()) await this.search(this.query);
    } catch (e) {
      this.error(e);
    }
  }

  async show(view: View) {
    await this.flush();
    this.view = view;
    // Autosave doesn't emit notes-changed, so previews of notes edited since may be stale.
    if (view.kind === "inbox") {
      try {
        this.inbox = await api.listInbox();
      } catch (e) {
        this.error(e);
      }
    }
  }

  openPage(path: string) {
    return this.show({ kind: "page", path });
  }

  async search(q: string) {
    this.query = q;
    if (!q.trim()) {
      this.results = [];
      return;
    }
    try {
      this.results = await api.searchNotes(q);
    } catch (e) {
      this.error(e);
    }
  }

  /** Folder of the open page, so Ctrl+N creates the new page next to it. */
  currentFolder(): string {
    if (this.view.kind !== "page") return "";
    const path = this.view.path;
    const folder = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
    return folder === api.INBOX ? "" : folder;
  }

  async newPage(folder = this.currentFolder()) {
    try {
      const meta = await api.createPage(folder, t("nb.untitled"));
      await this.openPage(meta.path);
      await this.refresh();
      this.focusTitle++;
    } catch (e) {
      this.error(e);
    }
  }

  newFolder() {
    this.dialog = {
      kind: "prompt",
      title: t("nb.folderName"),
      value: "",
      submit: async (name) => {
        try {
          await api.createFolder(name);
          await this.newPage(name);
        } catch (e) {
          this.error(e);
        }
      },
    };
  }

  async rename(path: string, title: string): Promise<string> {
    try {
      await this.flush();
      const meta = await api.renameNote(path, title);
      if (this.view.kind === "page" && this.view.path === path) this.view = { kind: "page", path: meta.path };
      await this.refresh();
      return meta.path;
    } catch (e) {
      this.error(e);
      return path;
    }
  }

  async move(path: string, folder: string) {
    try {
      await this.flush();
      const meta = await api.moveNote(path, folder);
      if (this.view.kind === "page" && this.view.path === path) this.view = { kind: "page", path: meta.path };
      await this.refresh();
    } catch (e) {
      this.error(e);
    }
  }

  async remove(path: string) {
    try {
      await this.flush();
      const trashPath = await api.trashNote(path);
      if (this.view.kind === "page" && this.view.path === path) this.view = { kind: "empty" };
      await this.refresh();
      this.notify(t("nb.deleted"), "info", {
        label: t("nb.undo"),
        run: async () => {
          await api.restoreNote(trashPath, path);
          await this.refresh();
        },
      });
    } catch (e) {
      this.error(e);
    }
  }

  notify(message: string, tone: Toast["tone"] = "info", action?: Toast["action"]) {
    const id = Date.now();
    this.toast = { id, message, tone, action };
    setTimeout(() => {
      if (this.toast?.id === id) this.toast = null;
    }, action ? 6000 : 3500);
  }

  error(e: unknown) {
    this.notify(t("err.generic", { e: String(e) }), "error");
  }
}

export const nb = new Notebook();

/** "Today 14:32", "Yesterday 09:10" or a short date, in the UI language. */
export function when(ms: number, lang: string = uiLang()): string {
  const d = new Date(ms);
  const now = new Date();
  const time = d.toLocaleTimeString(lang, { hour: "numeric", minute: "2-digit" });
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  const rel = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (diff === 0 || diff === 1) return `${capitalize(rel.format(-diff, "day"))} ${time}`;
  return d.toLocaleDateString(lang, { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" }) + ` ${time}`;
}

function capitalize(s: string) {
  return s.charAt(0).toLocaleUpperCase() + s.slice(1);
}
