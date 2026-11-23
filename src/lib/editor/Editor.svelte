<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { EditorView } from "@codemirror/view";
  import { addInboxNote, CONFLICT, NOT_FOUND, readNote, writeNote, type Note } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";
  import { createEditorState } from "./markdown";

  type Status = "saved" | "saving" | "error";
  let { path, status = $bindable("saved") }: { path: string; status?: Status } = $props();

  let host: HTMLDivElement;
  let view: EditorView | undefined;
  let loadedPath = "";
  /** Disk time of the open page as last read or saved, so a save never overwrites edits made elsewhere. */
  let modified = 0;
  /** The whole text, when it changed since the last save started; null when nothing waits. */
  let pending: string | null = null;
  /** Bumped by every keystroke and every page load, so a slow read can tell that it went stale. */
  let rev = 0;
  /** Text `rescue` already put in the Inbox, so a retry after a failure never adds it twice. */
  let kept = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Saves run one at a time, so each one sends the time the previous one returned.
  let queue = Promise.resolve();

  function flush(): Promise<void> {
    clearTimeout(timer);
    queue = queue.then(save);
    return queue;
  }

  async function save() {
    if (pending === null || !loadedPath) return;
    const [target, content] = [loadedPath, pending];
    pending = null;
    try {
      const next = await writeNote(target, content, modified);
      if (target === loadedPath) modified = next;
      // Text typed during the save waits for the next one.
      status = pending === null ? "saved" : "saving";
    } catch (e) {
      // Changed in another app (or gone, which also fails the time check): never overwrite it.
      if (String(e) === CONFLICT) return rescue(target, content, true);
      status = "error";
      pending ??= content; // keep it (or newer typing) so the next keystroke or flush retries
      nb.error(e);
    }
  }

  /** The page on disk, or null if it is gone (moved, renamed or deleted). */
  async function readOrGone(target: string): Promise<Note | null> {
    try {
      return await readNote(target);
    } catch (e) {
      if (String(e) === NOT_FOUND) return null;
      throw e;
    }
  }

  const showsPage = (target: string) => nb.view.kind === "page" && nb.view.path === target;

  /** The open page can't take the editor's text: it changed on disk (`conflict`) or it is gone.
   *  Keeps any unsaved text as a new Inbox note, then shows the page as it is on disk, or leaves
   *  it if it is gone. The outside edit is never overwritten and nothing typed is lost.
   *  Runs in the save queue, so no save starts meanwhile; `status` always ends "saved" or "error". */
  async function rescue(target: string, content: string, conflict: boolean) {
    clearTimeout(timer);
    let text = pending ?? content;
    let note: Note | null = null;
    try {
      for (;;) {
        const seen = rev;
        if (text.trim() && text !== kept) {
          await addInboxNote(text);
          kept = text;
        }
        note = await readOrGone(target);
        if (seen === rev) break;
        text = pending ?? text; // typed during the awaits: keep the newer text as well
      }
    } catch (e) {
      // Couldn't keep the text or read the page: leave the text in the editor, waiting to be saved.
      status = "error";
      pending ??= text;
      nb.error(e);
      return;
    }
    // From here to the end nothing awaits, so no keystroke can slip in between.
    kept = "";
    pending = null;
    status = "saved";
    const hasText = text.trim() !== "";
    if (note === null) {
      if (target === loadedPath) loadedPath = "";
      // When Flashjot itself renamed or deleted the page it has already switched the view away.
      if (view && showsPage(target)) {
        nb.notify(t(hasText ? "nb.pageGoneKept" : "nb.pageGone"), "error");
        void nb.pageGone(target); // not awaited: it may wait for this queue
      } else if (hasText) {
        nb.notify(t("nb.pageGoneKept"), "error");
      }
      return;
    }
    if (target === loadedPath) show(target, note);
    if (conflict) nb.notify(t(hasText ? "nb.conflict" : "nb.conflictNoText"), "error");
  }

  function onChange(doc: string) {
    rev++;
    pending = doc;
    status = "saving";
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }

  /** Shows `note`, read from `next`, as the open page. */
  function show(next: string, note: Note) {
    rev++;
    loadedPath = next;
    modified = note.modified;
    pending = null;
    status = "saved";
    view?.setState(createEditorState(note.content, { placeholder: t("nb.editorPlaceholder"), onChange }));
  }

  async function load(next: string) {
    await flush();
    let note: Note | null;
    try {
      note = await readOrGone(next);
    } catch (e) {
      nb.error(e);
      return;
    }
    if (note) return show(next, note);
    if (showsPage(next)) {
      nb.notify(t("nb.pageGone"), "error");
      void nb.pageGone(next);
    }
  }

  /** After a notes-changed event: if the page on disk is newer than what is shown and nothing is
   *  waiting to be saved, show the disk version. Our own saves never trigger this: the watcher
   *  drops their echo, and each save updates `modified` to the time on disk anyway.
   *
   *  Races: a save in flight has `status === "saving"` (it is set back to "saved" in the same tick
   *  that `modified` is updated), so it is skipped here. Text typed while the file is being read
   *  bumps `rev`, so the stale read is dropped, even if its save has finished by then. */
  async function reloadIfChanged() {
    if (!loadedPath || pending !== null || status !== "saved") return;
    const [target, seen] = [loadedPath, rev];
    let note: Note;
    try {
      note = await readNote(target);
    } catch (e) {
      // Gone (moved, renamed or deleted elsewhere): leave the page. Through the save queue, so
      // typing that started meanwhile is saved or kept first.
      if (String(e) === NOT_FOUND) {
        queue = queue.then(() => (target === loadedPath ? rescue(target, "", false) : undefined));
        await queue;
      }
      return;
    }
    if (target !== loadedPath || seen !== rev || pending !== null || status !== "saved") return;
    if (note.modified === modified) return;
    modified = note.modified;
    view?.setState(createEditorState(note.content, { placeholder: t("nb.editorPlaceholder"), onChange }));
  }

  export function focus() {
    view?.focus();
  }

  $effect(() => {
    // Read `path` unconditionally so the effect always tracks it; a short-circuit
    // before it would leave the effect with no dependencies and stop page switching.
    const next = path;
    if (view && next !== loadedPath) load(next);
  });

  onMount(() => {
    view = new EditorView({ parent: host, state: createEditorState("", { placeholder: "", onChange }) });
    nb.flush = flush;
    nb.reloadOpen = reloadIfChanged;
    load(path);
    window.addEventListener("blur", flush);
  });

  onDestroy(() => {
    flush();
    window.removeEventListener("blur", flush);
    if (nb.flush === flush) nb.flush = async () => {};
    if (nb.reloadOpen === reloadIfChanged) nb.reloadOpen = async () => {};
    view?.destroy();
    view = undefined; // a save that finishes later must not touch the destroyed view
  });
</script>

<div class="editor" bind:this={host}></div>

<style>
  .editor {
    height: 100%;
    min-height: 0;
  }
</style>
