<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { EditorView } from "@codemirror/view";
  import { CONFLICT, readNote, writeNote, type Note } from "$lib/api";
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
  let pending: string | null = null;
  /** Bumped by every keystroke and every page load, so a slow read can tell that it went stale. */
  let rev = 0;
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
      status = "saved";
    } catch (e) {
      if (String(e) === CONFLICT) {
        // Changed in another app: show that version instead of overwriting it.
        nb.notify(t("nb.conflict"), "error");
        if (target === loadedPath) await open(target);
        return;
      }
      status = "error";
      pending = content; // keep it so the next keystroke or flush retries
      nb.error(e);
    }
  }

  function onChange(doc: string) {
    rev++;
    pending = doc;
    status = "saving";
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }

  /** Shows the page as it is on disk. */
  async function open(next: string) {
    let note: Note;
    try {
      note = await readNote(next);
    } catch (e) {
      nb.error(e);
      return;
    }
    rev++;
    loadedPath = next;
    modified = note.modified;
    pending = null;
    status = "saved";
    view?.setState(createEditorState(note.content, { placeholder: t("nb.editorPlaceholder"), onChange }));
  }

  async function load(next: string) {
    await flush();
    await open(next);
  }

  /** After a notes-changed event: if the page on disk is newer than what is shown and nothing is
   *  waiting to be saved, show the disk version. Our own saves never trigger this, because each
   *  save updates `modified` to the time on disk.
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
    } catch {
      return; // moved or deleted elsewhere: the sidebar refresh shows that
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
