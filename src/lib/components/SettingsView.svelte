<script lang="ts">
  import { onMount } from "svelte";
  import { getSettings, isMac, notesDir, prettyShortcut, revealNotesDir, setSettings, type Settings } from "$lib/api";
  import { setLanguage, t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";

  let settings = $state<Settings | null>(null);
  let defaultDir = $state("");
  let recording = $state<"quickShortcut" | "notebookShortcut" | null>(null);
  let problems = $state<string[]>([]);
  const isLinux = /Linux/i.test(navigator.userAgent) && !/Android/i.test(navigator.userAgent);

  onMount(async () => {
    try {
      settings = await getSettings();
      defaultDir = await notesDir();
    } catch (e) {
      nb.error(e);
    }
  });

  /** Turn a keydown into a Tauri accelerator such as "CommandOrControl+Alt+N". */
  function accelerator(e: KeyboardEvent): string | null {
    const mods: string[] = [];
    if (isMac ? e.metaKey : e.ctrlKey) mods.push("CommandOrControl");
    if (isMac && e.ctrlKey) mods.push("Control");
    if (!isMac && e.metaKey) mods.push("Super");
    if (e.altKey) mods.push("Alt");
    if (e.shiftKey) mods.push("Shift");
    const code = e.code;
    let key: string | null = null;
    if (/^Key[A-Z]$/.test(code)) key = code.slice(3);
    else if (/^Digit\d$/.test(code)) key = code.slice(5);
    else if (/^F\d{1,2}$/.test(code)) key = code;
    else if (["Space", "Backquote", "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Comma", "Period", "Slash"].includes(code)) key = code;
    const hasRealModifier = mods.some((m) => m !== "Shift");
    return key && hasRealModifier ? [...mods, key].join("+") : null;
  }

  function onRecordKey(e: KeyboardEvent) {
    if (!recording || !settings) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === "Escape") {
      recording = null;
      return;
    }
    const accel = accelerator(e);
    if (accel) {
      settings[recording] = accel;
      recording = null;
    }
  }

  async function save() {
    if (!settings) return;
    try {
      problems = await setSettings($state.snapshot(settings) as Settings);
      setLanguage(settings.language);
      defaultDir = await notesDir();
      if (!problems.length) nb.notify(t("set.saved"));
    } catch (e) {
      nb.error(e);
    }
  }
</script>

<svelte:window onkeydowncapture={onRecordKey} />

<section class="settings">
  <h1>{t("set.title")}</h1>

  {#if settings}
    <form onsubmit={(e) => (e.preventDefault(), save())}>
      <fieldset>
        <legend>{t("set.shortcuts")}</legend>
        {#each [["quickShortcut", "set.quickShortcut"], ["notebookShortcut", "set.notebookShortcut"]] as const as [field, label] (field)}
          <div class="field row">
            <span class="label">{t(label)}</span>
            <button
              type="button"
              class="shortcut"
              class:recording={recording === field}
              onclick={() => (recording = recording === field ? null : field)}
            >
              {recording === field ? t("set.record") : prettyShortcut(settings[field])}
            </button>
          </div>
        {/each}
        <p class="hint">{t("set.recordHint")}</p>
        {#if isLinux}<p class="hint">{t("set.wayland")}</p>{/if}
      </fieldset>

      <fieldset>
        <legend>{t("set.notesDir")}</legend>
        <div class="field">
          <input bind:value={settings.notesDir} placeholder={defaultDir} spellcheck="false" aria-label={t("set.notesDir")} />
          <p class="hint">
            {t("set.notesDirHint")}
            <button type="button" class="link" onclick={() => revealNotesDir().catch(nb.error.bind(nb))}>{t("set.reveal")}</button>
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend>{t("set.language")}</legend>
        <select bind:value={settings.language} aria-label={t("set.language")}>
          <option value="auto">{t("set.auto")}</option>
          <option value="en">English</option>
          <option value="tr">Türkçe</option>
        </select>
      </fieldset>

      <label class="check">
        <input type="checkbox" bind:checked={settings.launchAtLogin} />
        {t("set.launch")}
      </label>

      {#if problems.length}
        <div class="problems" role="alert">
          <p>{t("set.problem")}</p>
          <ul>{#each problems as p (p)}<li>{p}</li>{/each}</ul>
        </div>
      {/if}

      <button type="submit" class="primary">{t("set.save")}</button>
    </form>
  {/if}
</section>

<style>
  .settings {
    max-width: 60ch;
    padding: 28px 40px 60px;
  }

  h1 {
    margin: 0 0 20px;
    font-size: var(--step-3);
  }

  fieldset {
    margin: 0 0 22px;
    padding: 0;
    border: 0;
  }

  legend {
    margin-bottom: 10px;
    font-weight: 700;
    font-size: var(--step-1);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    border-bottom: 1px solid var(--line);
  }

  .shortcut {
    min-width: 140px;
    padding: 5px 12px;
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 8px;
    background: var(--sheet);
    font-weight: 600;
  }

  .shortcut.recording {
    border-color: var(--ink);
    color: var(--ink);
    background: var(--ink-soft);
  }

  .hint {
    font-variant-ligatures: none; /* keep "--quick" from becoming an en dash */
    margin: 8px 0 0;
    color: var(--muted);
    font-size: var(--step--1);
  }

  input:not([type="checkbox"]),
  select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--sheet);
  }

  select {
    width: auto;
    min-width: 200px;
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 3px;
    font-size: inherit;
  }

  .check {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 22px;
  }

  .check input {
    width: 1.1em;
    height: 1.1em;
    accent-color: var(--ink);
  }

  .problems {
    margin-bottom: 16px;
    padding: 10px 14px;
    border-left: 3px solid var(--danger);
    background: color-mix(in srgb, var(--danger) 8%, transparent);
  }

  .problems p {
    margin: 0;
    font-weight: 700;
  }

  .primary {
    padding: 8px 20px;
    border: 0;
    border-radius: 8px;
    background: var(--ink);
    color: var(--sheet);
    font-weight: 700;
  }
</style>
