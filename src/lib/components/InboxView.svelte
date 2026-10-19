<script lang="ts">
  import { FolderInput, PencilLine, Trash2 } from "@lucide/svelte";
  import { getSettings, isMac, prettyShortcut } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb, when } from "$lib/notebook.svelte";
  import { onMount } from "svelte";

  let quickKey = $state(prettyShortcut("CommandOrControl+Alt+N"));
  const mod = isMac ? "⌘" : "Ctrl+";

  onMount(() => {
    getSettings()
      .then((s) => (quickKey = prettyShortcut(s.quickShortcut)))
      .catch(() => {});
  });

  function cards() {
    return [...document.querySelectorAll<HTMLElement>(".note-card")];
  }

  function onKey(e: KeyboardEvent, path: string) {
    // Keys on the card's own buttons (Enter, Space) belong to those buttons.
    if (e.target !== e.currentTarget) return;
    const list = cards();
    const i = list.indexOf(e.currentTarget as HTMLElement);
    if (e.key === "ArrowDown" || e.key === "j") {
      e.preventDefault();
      list[Math.min(i + 1, list.length - 1)]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "k") {
      e.preventDefault();
      list[Math.max(i - 1, 0)]?.focus();
    } else if (e.key === "Enter") {
      nb.openPage(path);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const next = list[i + 1] ?? list[i - 1];
      nb.remove(path).then(() => next?.focus());
    } else if (e.key === "m" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m")) {
      e.preventDefault();
      nb.dialog = { kind: "move", path };
    }
  }
</script>

<section class="inbox">
  <header>
    <h1>{t("nb.inbox")}</h1>
    <p>{t("nb.inboxHint")}</p>
  </header>

  {#if nb.inbox.length === 0}
    <p class="empty">{t("nb.inboxEmpty", { key: quickKey })}</p>
  {:else}
    <ol>
      {#each nb.inbox as note (note.path)}
        <li>
          <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
          <article class="note-card" tabindex="0" onkeydown={(e) => onKey(e, note.path)} aria-label={note.preview}>
            <div class="meta">
              <time datetime={new Date(note.modified).toISOString()}>{when(note.modified)}</time>
              <div class="tools">
                <button title="{t('nb.moveTo')} ({mod}M)" onclick={() => (nb.dialog = { kind: "move", path: note.path })}>
                  <FolderInput size={15} /> <span>{t("nb.moveTo")}</span>
                </button>
                <button title={t("nb.open")} aria-label={t("nb.open")} onclick={() => nb.openPage(note.path)}>
                  <PencilLine size={15} />
                </button>
                <button title="{t('nb.delete')} (Del)" aria-label={t("nb.delete")} onclick={() => nb.remove(note.path)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <p class="text">{note.preview}</p>
          </article>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .inbox {
    max-width: 72ch;
    padding: 28px 40px 60px;
  }

  header h1 {
    margin: 0;
    font-size: var(--step-3);
    line-height: 1.2;
  }

  header p {
    margin: 4px 0 24px;
    color: var(--muted);
  }

  .empty {
    padding: 28px;
    border: 1px dashed var(--line);
    border-radius: 10px;
    color: var(--muted);
  }

  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }

  /* Each quick note is drawn like the quick box it came from: an index card with a red rule. */
  .note-card {
    position: relative;
    padding: 10px 16px 12px;
    background: var(--sheet);
    border: 1px solid var(--line);
    border-top: 2px solid var(--card-rule);
    border-radius: 3px 3px 8px 8px;
  }

  .note-card:focus-visible {
    border-radius: 3px 3px 8px 8px;
  }

  .meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 28px;
    color: var(--muted);
    font-size: var(--step--1);
  }

  .tools {
    display: flex;
    gap: 2px;
    opacity: 0;
  }

  .note-card:hover .tools,
  .note-card:focus-within .tools {
    opacity: 1;
  }

  .tools button {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted);
    font-size: var(--step--1);
  }

  .tools button:hover {
    color: var(--ink);
    background: var(--ink-soft);
  }

  .text {
    margin: 2px 0 0;
    font-family: var(--writer);
    font-size: var(--step-1);
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
</style>
