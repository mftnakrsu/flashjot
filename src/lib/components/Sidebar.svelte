<script lang="ts">
  import { ChevronDown, ChevronRight, FilePlus, FileText, FolderPlus, Inbox, ListChecks, Search, Settings, Trash2 } from "@lucide/svelte";
  import { isMac } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";

  let { searchInput = $bindable<HTMLInputElement>() } = $props();

  let collapsed = $state<Record<string, boolean>>({});
  const mod = isMac ? "⌘" : "Ctrl+";

  const isOpen = (path: string) => nb.view.kind === "page" && nb.view.path === path;

  function onSearchKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      nb.search("");
      (e.target as HTMLInputElement).blur();
    } else if (e.key === "Enter") {
      // Search right away in case the debounced search for the last keystroke hasn't run yet.
      nb.search(nb.query).then(() => nb.results[0] && nb.openPage(nb.results[0].path));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      document.querySelector<HTMLElement>(".results button")?.focus();
    }
  }

  /** Arrow keys move between rows; Delete trashes the focused page. */
  function onListKey(e: KeyboardEvent) {
    const rows = [...document.querySelectorAll<HTMLElement>("nav .row")];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown" && i >= 0) {
      e.preventDefault();
      rows[Math.min(i + 1, rows.length - 1)].focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      rows[Math.max(i - 1, 0)].focus();
    } else if (e.key === "Delete") {
      const path = (document.activeElement as HTMLElement)?.dataset.path;
      if (path) nb.remove(path);
    }
  }
</script>

<aside class="sidebar">
  <div class="search">
    <Search size={15} aria-hidden="true" />
    <input
      bind:this={searchInput}
      type="search"
      placeholder={t("nb.search")}
      aria-label={t("nb.search")}
      value={nb.query}
      oninput={(e) => nb.searchSoon(e.currentTarget.value)}
      onkeydown={onSearchKey}
    />
    <kbd>{mod}K</kbd>
  </div>

  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <nav onkeydown={onListKey}>
    {#if nb.query.trim()}
      <ul class="results">
        {#each nb.results as hit (hit.path)}
          <li>
            <button class="row hit" class:active={isOpen(hit.path)} onclick={() => nb.openPage(hit.path)}>
              <span class="title">{hit.title}</span>
              {#if hit.snippet}<span class="snippet">{hit.snippet}</span>{/if}
            </button>
          </li>
        {:else}
          <li class="none">{t("nb.noResults", { q: nb.query })}</li>
        {/each}
      </ul>
    {:else}
      <button class="row inbox" class:active={nb.view.kind === "inbox"} onclick={() => nb.show({ kind: "inbox" })}>
        <Inbox size={16} aria-hidden="true" />
        <span class="title">{t("nb.inbox")}</span>
        {#if nb.inbox.length}<span class="count">{nb.inbox.length}</span>{/if}
      </button>
      <button class="row inbox last" class:active={nb.view.kind === "tasks"} onclick={() => nb.show({ kind: "tasks" })}>
        <ListChecks size={16} aria-hidden="true" />
        <span class="title">{t("nb.openTasks")}</span>
        {#if nb.openTaskCount}<span class="count">{nb.openTaskCount}</span>{/if}
      </button>

      {#each nb.tree.root_pages as page (page.path)}
        {@render pageRow(page.path, page.title)}
      {/each}

      {#each nb.tree.folders as folder (folder.name)}
        <div class="folder">
          <div class="folder-head">
            <button
              class="row folder-name"
              aria-expanded={!collapsed[folder.name]}
              onclick={() => (collapsed[folder.name] = !collapsed[folder.name])}
            >
              {#if collapsed[folder.name]}<ChevronRight size={14} />{:else}<ChevronDown size={14} />{/if}
              <span class="title">{folder.name}</span>
            </button>
            <button class="icon" title={t("nb.newPage")} aria-label="{t('nb.newPage')}: {folder.name}" onclick={() => nb.newPage(folder.name)}>
              <FilePlus size={14} />
            </button>
          </div>
          {#if !collapsed[folder.name]}
            <div class="pages">
              {#each folder.pages as page (page.path)}
                {@render pageRow(page.path, page.title)}
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </nav>

  <div class="actions">
    <button onclick={() => nb.newPage()}><FilePlus size={15} /> {t("nb.newPage")} <kbd>{mod}N</kbd></button>
    <div class="secondary">
      <button class="icon" title={t("nb.newFolder")} aria-label={t("nb.newFolder")} onclick={() => nb.newFolder()}>
        <FolderPlus size={16} />
      </button>
      <button class="icon" title={t("nb.settings")} aria-label={t("nb.settings")} onclick={() => nb.show({ kind: "settings" })}>
        <Settings size={16} />
      </button>
    </div>
  </div>
</aside>

{#snippet pageRow(path: string, title: string)}
  <div class="page-row">
    <button class="row page" class:active={isOpen(path)} data-path={path} onclick={() => nb.openPage(path)}>
      <FileText size={14} aria-hidden="true" />
      <span class="title">{title}</span>
    </button>
    <button class="icon hover" title={t("nb.delete")} aria-label="{t('nb.delete')}: {title}" onclick={() => nb.remove(path)}>
      <Trash2 size={13} />
    </button>
  </div>
{/snippet}

<style>
  .sidebar {
    min-width: 0;
    overflow: hidden;
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 0;
    background: var(--side);
    border-right: 1px solid var(--line);
    font-size: var(--step-0);
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 12px 8px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--sheet);
    color: var(--muted);
  }

  .search:focus-within {
    border-color: var(--ink);
    box-shadow: 0 0 0 1px var(--ink);
  }

  .search input:focus-visible {
    box-shadow: none;
  }

  .search input {
    flex: 1;
    width: 0;
    min-width: 0;
    border: 0;
    outline: 0;
    background: none;
    color: var(--graphite);
  }

  nav {
    overflow-y: auto;
    padding: 4px 8px 12px;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border: 0;
    border-radius: 6px;
    background: none;
    text-align: left;
    color: var(--graphite);
  }

  .row:hover {
    background: color-mix(in srgb, var(--graphite) 6%, transparent);
  }

  .row.active {
    background: var(--ink-soft);
    color: var(--ink);
  }

  .row :global(svg) {
    flex: none;
    color: var(--muted);
  }

  .row.active :global(svg) {
    color: var(--ink);
  }

  .title {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .inbox {
    font-weight: 600;
  }

  .inbox.last {
    margin-bottom: 10px;
  }

  .count {
    min-width: 1.6em;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--card-rule);
    color: #fff;
    font-size: var(--step--1);
    text-align: center;
  }

  .folder {
    margin-top: 6px;
  }

  .folder-head,
  .page-row {
    display: flex;
    align-items: center;
  }

  .folder-name {
    color: var(--muted);
    font-weight: 600;
    font-size: var(--step--1);
  }

  .pages {
    padding-left: 12px;
  }

  .icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted);
  }

  .icon:hover {
    color: var(--ink);
    background: color-mix(in srgb, var(--graphite) 6%, transparent);
  }

  .icon.hover {
    opacity: 0;
  }

  .page-row:hover .icon.hover,
  .icon.hover:focus-visible {
    opacity: 1;
  }

  .hit {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .hit .title {
    width: 100%;
    font-weight: 600;
  }

  .snippet {
    width: 100%;
    color: var(--muted);
    font-size: var(--step--1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .none {
    padding: 8px;
    color: var(--muted);
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 12px;
    border-top: 1px solid var(--line);
  }

  .actions > button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--sheet);
    color: var(--graphite);
  }

  .actions > button:hover {
    border-color: var(--ink);
    color: var(--ink);
  }

  .secondary {
    display: flex;
    gap: 2px;
  }

  kbd {
    margin-left: auto;
  }
</style>
