<script lang="ts">
  import { onMount } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import { PanelLeft } from "@lucide/svelte";
  import { isMac, onNotesChanged } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import InboxView from "$lib/components/InboxView.svelte";
  import PageView from "$lib/components/PageView.svelte";
  import SettingsView from "$lib/components/SettingsView.svelte";
  import Dialogs from "$lib/components/Dialogs.svelte";
  import Toast from "$lib/components/Toast.svelte";

  let searchInput = $state<HTMLInputElement>();

  function onKeydown(e: KeyboardEvent) {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (!mod || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "k" || key === "p") {
      e.preventDefault();
      nb.sidebarOpen = true;
      queueMicrotask(() => searchInput?.select());
    } else if (key === "n") {
      e.preventDefault();
      nb.newPage();
    } else if (key === "b") {
      e.preventDefault();
      nb.sidebarOpen = !nb.sidebarOpen;
    } else if (key === "m" && nb.view.kind === "page") {
      e.preventDefault();
      nb.dialog = { kind: "move", path: nb.view.path };
    } else if (key === ",") {
      e.preventDefault();
      nb.show({ kind: "settings" });
    } else if (key === "s") {
      e.preventDefault(); // autosave already; just flush now
      nb.flush();
    }
  }

  onMount(() => {
    nb.refresh();
    const offs = [
      onNotesChanged(() => nb.refresh()),
      listen<string>("open-note", (e) => nb.openPage(e.payload)),
      listen("open-settings", () => nb.show({ kind: "settings" })),
    ];
    return () => offs.forEach((p) => p.then((off) => off()));
  });
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell" class:collapsed={!nb.sidebarOpen}>
  {#if nb.sidebarOpen}
    <Sidebar bind:searchInput />
  {/if}

  <main>
    <button
      class="toggle"
      title="{t('nb.toggleSidebar')} ({isMac ? '⌘' : 'Ctrl+'}B)"
      aria-label={t("nb.toggleSidebar")}
      onclick={() => (nb.sidebarOpen = !nb.sidebarOpen)}
    >
      <PanelLeft size={16} />
    </button>

    {#if nb.view.kind === "inbox"}
      <InboxView />
    {:else if nb.view.kind === "page"}
      <PageView path={nb.view.path} />
    {:else if nb.view.kind === "settings"}
      <SettingsView />
    {:else}
      <section class="empty">
        <h1>{t("nb.emptyTitle")}</h1>
        <p>{t("nb.emptyBody", { key: isMac ? "⌘N" : "Ctrl+N" })}</p>
      </section>
    {/if}
  </main>
</div>

<Dialogs />
<Toast />

<style>
  :global(body) {
    overflow: hidden;
  }

  .shell {
    height: 100vh;
    display: grid;
    grid-template-columns: 264px 1fr;
  }

  .shell.collapsed {
    grid-template-columns: 1fr;
  }

  main {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    background: var(--sheet);
  }

  /* The page view scrolls inside the editor; other views scroll in main. */
  main:has(:global(.page)) {
    overflow: hidden;
  }

  .toggle {
    position: absolute;
    top: 10px;
    left: 8px;
    z-index: 2;
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--muted);
    opacity: 0.5;
  }

  .toggle:hover,
  .toggle:focus-visible {
    opacity: 1;
    color: var(--ink);
  }

  .empty {
    padding: 28px 40px;
    color: var(--muted);
  }

  .empty h1 {
    margin: 0 0 6px;
    color: var(--graphite);
    font-size: var(--step-2);
  }
</style>
