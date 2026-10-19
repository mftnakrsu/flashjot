<script lang="ts">
  import { FolderInput, Trash2 } from "@lucide/svelte";
  import { INBOX } from "$lib/api";
  import Editor from "$lib/editor/Editor.svelte";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";

  let { path }: { path: string } = $props();

  let status = $state<"saved" | "saving" | "error">("saved");
  let titleInput: HTMLInputElement;
  let editor: Editor;

  const fileTitle = $derived(path.split("/").pop()!.replace(/\.md$/, ""));
  const folder = $derived(path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "");
  let title = $state("");

  $effect(() => {
    title = fileTitle;
  });

  $effect(() => {
    if (nb.focusTitle) {
      queueMicrotask(() => {
        titleInput?.focus();
        titleInput?.select();
      });
    }
  });

  async function commitTitle() {
    const next = title.trim();
    if (!next || next === fileTitle) {
      title = fileTitle;
      return;
    }
    await nb.rename(path, next);
  }

  function onTitleKey(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === "ArrowDown") {
      e.preventDefault();
      commitTitle().then(() => editor?.focus());
    } else if (e.key === "Escape") {
      title = fileTitle;
      editor?.focus();
    }
  }
</script>

<section class="page">
  <header>
    <span class="crumb">{folder === INBOX ? t("nb.inbox") : folder || t("nb.rootFolder")}</span>
    <span class="status" class:error={status === "error"} aria-live="polite">
      {status === "saving" ? t("nb.saving") : status === "error" ? "!" : `✓ ${t("nb.saved")}`}
    </span>
    <button class="icon" title={t("nb.moveTo")} aria-label={t("nb.moveTo")} onclick={() => (nb.dialog = { kind: "move", path })}>
      <FolderInput size={16} />
    </button>
    <button class="icon" title={t("nb.delete")} aria-label={t("nb.delete")} onclick={() => nb.remove(path)}>
      <Trash2 size={16} />
    </button>
  </header>

  <input
    class="title"
    bind:this={titleInput}
    bind:value={title}
    onblur={commitTitle}
    onkeydown={onTitleKey}
    aria-label={t("nb.pageTitle")}
    placeholder={t("nb.untitled")}
    spellcheck="false"
  />

  <div class="body">
    <Editor bind:this={editor} {path} bind:status />
  </div>
</section>

<style>
  .page {
    height: 100%;
    display: grid;
    grid-template-rows: auto auto 1fr;
    min-height: 0;
    padding: 0 40px;
  }

  header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 0 0;
    color: var(--muted);
    font-size: var(--step--1);
  }

  .crumb {
    flex: 1;
  }

  .status {
    margin-right: 8px;
  }

  .status.error {
    color: var(--danger);
    font-weight: 700;
  }

  .icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted);
  }

  .icon:hover {
    color: var(--ink);
    background: var(--ink-soft);
  }

  .title {
    width: 100%;
    max-width: 70ch;
    margin: 10px 0 6px;
    padding: 0;
    border: 0;
    outline: 0;
    background: none;
    font-family: var(--ui);
    font-size: var(--step-3);
    font-weight: 700;
    line-height: 1.2;
    color: var(--graphite);
  }

  .title:focus-visible {
    box-shadow: none;
    border-bottom: 2px solid var(--ink);
  }

  .body {
    min-height: 0;
  }
</style>
