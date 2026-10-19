<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { EditorView } from "@codemirror/view";
  import { readNote, writeNote } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";
  import { createEditorState } from "./markdown";

  type Status = "saved" | "saving" | "error";
  let { path, status = $bindable("saved") }: { path: string; status?: Status } = $props();

  let host: HTMLDivElement;
  let view: EditorView | undefined;
  let loadedPath = "";
  let pending: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function flush() {
    clearTimeout(timer);
    if (pending === null || !loadedPath) return;
    const [target, content] = [loadedPath, pending];
    pending = null;
    try {
      await writeNote(target, content);
      status = "saved";
    } catch (e) {
      status = "error";
      pending = content; // keep it so the next keystroke or flush retries
      nb.error(e);
    }
  }

  function onChange(doc: string) {
    pending = doc;
    status = "saving";
    clearTimeout(timer);
    timer = setTimeout(flush, 500);
  }

  async function load(next: string) {
    await flush();
    let doc = "";
    try {
      doc = await readNote(next);
    } catch (e) {
      nb.error(e);
      return;
    }
    loadedPath = next;
    status = "saved";
    view?.setState(createEditorState(doc, { placeholder: t("nb.editorPlaceholder"), onChange }));
  }

  export function focus() {
    view?.focus();
  }

  $effect(() => {
    if (view && path !== loadedPath) load(path);
  });

  onMount(() => {
    view = new EditorView({ parent: host, state: createEditorState("", { placeholder: "", onChange }) });
    nb.flush = flush;
    load(path);
    window.addEventListener("blur", flush);
  });

  onDestroy(() => {
    flush();
    window.removeEventListener("blur", flush);
    if (nb.flush === flush) nb.flush = async () => {};
    view?.destroy();
  });
</script>

<div class="editor" bind:this={host}></div>

<style>
  .editor {
    height: 100%;
    min-height: 0;
  }
</style>
