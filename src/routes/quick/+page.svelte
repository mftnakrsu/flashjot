<script lang="ts">
  import { onMount, tick } from "svelte";
  import { listen } from "@tauri-apps/api/event";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { addQuickNote, getSettings, hideWindow, openNotebook, prettyShortcut } from "$lib/api";
  import { t } from "$lib/i18n.svelte";

  const DRAFT_KEY = "flashjot.quickDraft";

  let text = $state(readDraft());
  let status = $state<"idle" | "saving" | "saved" | "error">("idle");
  let savedAs = $state<"note" | "tasks">("note");
  let notebookKey = $state(prettyShortcut("CommandOrControl+Alt+D"));
  let box: HTMLTextAreaElement;
  // Hide on blur only after the box really had focus: some desktops (no WM, strict focus
  // stealing prevention, Wayland) map it unfocused and report a blur right away.
  let hadFocus = false;

  function readDraft(): string {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  }

  // The draft survives Esc, focus loss and app restarts: an idea is never lost.
  $effect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, text);
    } catch {
      /* storage unavailable: the draft still lives in memory */
    }
  });

  async function focusBox() {
    await tick();
    box?.focus();
    box?.setSelectionRange(text.length, text.length);
  }

  async function hide() {
    if (status === "saved") return; // already hiding
    await hideWindow();
  }

  async function save() {
    if (!text.trim() || status === "saving" || status === "saved") return;
    status = "saving";
    try {
      const saved = await addQuickNote(text, t("tasks.pageTitle"));
      if (saved.kind === "tasks" && saved.count === 0) {
        status = "idle";
        return;
      }
      savedAs = saved.kind;
      text = "";
      status = "saved";
      setTimeout(async () => {
        await hideWindow();
        status = "idle";
      }, 450);
    } catch {
      status = "error";
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (status === "saving" || status === "saved") {
      e.preventDefault();
      return;
    }
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    }
  }

  onMount(() => {
    const unlisteners = [
      listen("quick-shown", () => {
        hadFocus = false;
        if (status !== "saving") status = "idle";
        focusBox();
      }),
      getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (focused) {
          hadFocus = true;
          focusBox();
        } else if (hadFocus && (status === "idle" || status === "error")) {
          hide();
        }
      }),
    ];
    getSettings()
      .then((s) => (notebookKey = prettyShortcut(s.notebookShortcut)))
      .catch(() => {});
    focusBox();
    return () => unlisteners.forEach((p) => p.then((off) => off()));
  });
</script>

<main class="card" class:saved={status === "saved"} class:error={status === "error"}>
  <header data-tauri-drag-region>
    <span class="brand" data-tauri-drag-region>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
      Flashjot
    </span>
    <button class="to-notebook" onclick={() => openNotebook()}>
      {t("quick.notebook")} <kbd>{notebookKey}</kbd>
    </button>
  </header>

  <div class="rule" aria-hidden="true"></div>

  <textarea
    bind:this={box}
    bind:value={text}
    onkeydown={onKeydown}
    placeholder={status === "saved" ? "" : t("quick.placeholder")}
    aria-label={t("quick.placeholder")}
    spellcheck="true"
    readonly={status === "saving" || status === "saved"}
  ></textarea>

  <footer>
    {#if status === "saved"}
      <span class="msg ok" role="status">✓ {t(savedAs === "tasks" ? "quick.savedTasks" : "quick.saved")}</span>
    {:else if status === "error"}
      <span class="msg bad" role="alert">{t("quick.error")}</span>
    {:else}
      <span class="hints">
        <span><kbd>[]</kbd> {t("quick.task")}</span>
        <span><kbd>↵</kbd> {t("quick.save")}</span>
        <span><kbd>⇧↵</kbd> {t("quick.newline")}</span>
        <span><kbd>Esc</kbd> {t("quick.close")}</span>
      </span>
    {/if}
  </footer>
</main>

<style>
  :global(html),
  :global(body) {
    background: var(--sheet);
    overflow: hidden;
  }

  .card {
    height: 100vh;
    display: grid;
    grid-template-rows: auto 2px 1fr auto;
    background: var(--sheet);
    border: 1px solid var(--line);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 6px 14px;
    color: var(--muted);
    font-size: var(--step--1);
    user-select: none;
    cursor: grab;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 650;
    letter-spacing: 0.01em;
  }

  .brand svg {
    width: 14px;
    height: 14px;
    fill: var(--card-rule);
  }

  .to-notebook {
    border: 0;
    background: none;
    padding: 2px 4px;
    color: var(--muted);
    font-size: var(--step--1);
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }

  .to-notebook:hover {
    color: var(--ink);
  }

  /* The index-card header line. On save it fills with green from the left. */
  .rule {
    background: linear-gradient(to right, var(--ok) 50%, var(--card-rule) 50%);
    background-size: 200% 100%;
    background-position: 100% 0;
    transition: background-position 380ms cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  .saved .rule {
    background-position: 0 0;
  }

  textarea {
    border: 0;
    outline: none;
    resize: none;
    background: transparent;
    padding: 10px 16px 4px;
    font-family: var(--writer);
    font-size: var(--step-1);
    line-height: 1.55;
    color: var(--graphite);
  }

  /* The only field in the window: the caret is focus indicator enough. */
  textarea:focus-visible {
    box-shadow: none;
  }

  textarea::placeholder {
    color: var(--muted);
    opacity: 0.7;
  }

  footer {
    padding: 6px 14px 10px;
    font-size: var(--step--1);
    color: var(--muted);
    min-height: 32px;
  }

  .hints {
    display: flex;
    gap: 16px;
  }

  .msg.ok {
    color: var(--ok);
    font-weight: 600;
  }

  .msg.bad {
    color: var(--danger);
  }
</style>
