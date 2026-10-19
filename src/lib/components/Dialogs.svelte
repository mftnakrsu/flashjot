<script lang="ts">
  import { Folder, FolderPlus, Home } from "@lucide/svelte";
  import { INBOX } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";
  import { tick } from "svelte";

  let value = $state("");
  let filter = $state("");
  let dialogEl = $state<HTMLDialogElement>();

  const folders = $derived(
    nb.folderNames.filter((f) => f !== INBOX && f.toLowerCase().includes(filter.trim().toLowerCase())),
  );

  $effect(() => {
    const d = nb.dialog;
    if (!dialogEl) return;
    if (d) {
      value = d.kind === "prompt" ? d.value : "";
      filter = "";
      if (!dialogEl.open) dialogEl.showModal();
      tick().then(() => dialogEl?.querySelector<HTMLInputElement>("input")?.focus());
    } else if (dialogEl.open) {
      dialogEl.close();
    }
  });

  function close() {
    nb.dialog = null;
  }

  function submitPrompt(e: SubmitEvent) {
    e.preventDefault();
    const d = nb.dialog;
    if (d?.kind !== "prompt" || !value.trim()) return;
    close();
    d.submit(value.trim());
  }

  function moveTo(folder: string) {
    const d = nb.dialog;
    if (d?.kind !== "move") return;
    close();
    nb.move(d.path, folder);
  }

  function onFilterKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      const exact = nb.folderNames.find((f) => f.toLowerCase() === filter.trim().toLowerCase());
      if (exact) moveTo(exact);
      else if (folders.length === 1) moveTo(folders[0]);
      else if (filter.trim()) moveTo(filter.trim()); // new folder
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      dialogEl?.querySelector<HTMLElement>(".choices button")?.focus();
    }
  }

  function onChoicesKey(e: KeyboardEvent) {
    const items = [...(dialogEl?.querySelectorAll<HTMLElement>(".choices button") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[Math.min(i + 1, items.length - 1)]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (i <= 0) dialogEl?.querySelector<HTMLInputElement>("input")?.focus();
      else items[i - 1].focus();
    }
  }
</script>

<dialog bind:this={dialogEl} onclose={close} onclick={(e) => e.target === dialogEl && close()}>
  {#if nb.dialog?.kind === "prompt"}
    <form onsubmit={submitPrompt}>
      <label for="prompt-input">{nb.dialog.title}</label>
      <input id="prompt-input" bind:value autocomplete="off" />
      <div class="buttons">
        <button type="button" onclick={close}>{t("nb.cancel")}</button>
        <button type="submit" class="primary">{t("nb.ok")}</button>
      </div>
    </form>
  {:else if nb.dialog?.kind === "move"}
    <div class="move">
      <label for="move-filter">{t("nb.moveTo")}</label>
      <input
        id="move-filter"
        bind:value={filter}
        onkeydown={onFilterKey}
        placeholder={t("nb.folderName")}
        autocomplete="off"
      />
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <ul class="choices" onkeydown={onChoicesKey}>
        {#each folders as f (f)}
          <li><button onclick={() => moveTo(f)}><Folder size={15} /> {f}</button></li>
        {/each}
        {#if filter.trim() && !nb.folderNames.some((f) => f.toLowerCase() === filter.trim().toLowerCase())}
          <li><button onclick={() => moveTo(filter.trim())}><FolderPlus size={15} /> {t("nb.newFolderOption")} “{filter.trim()}”</button></li>
        {/if}
        <li><button onclick={() => moveTo("")}><Home size={15} /> {t("nb.rootFolder")}</button></li>
      </ul>
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: min(420px, 90vw);
    padding: 18px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--sheet);
    color: var(--graphite);
    box-shadow: 0 18px 50px rgb(0 0 0 / 0.22);
  }

  dialog::backdrop {
    background: rgb(20 22 28 / 0.35);
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 700;
  }

  input {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--paper);
    outline: 0;
  }

  input:focus {
    border-color: var(--ink);
  }

  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 14px;
  }

  .buttons button {
    padding: 6px 14px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: none;
  }

  .buttons .primary {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--sheet);
  }

  ul {
    list-style: none;
    margin: 10px 0 0;
    padding: 0;
    max-height: 260px;
    overflow-y: auto;
  }

  .choices button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: 0;
    border-radius: 6px;
    background: none;
    text-align: left;
  }

  .choices button:hover,
  .choices button:focus-visible {
    background: var(--ink-soft);
    color: var(--ink);
    box-shadow: none;
  }
</style>
