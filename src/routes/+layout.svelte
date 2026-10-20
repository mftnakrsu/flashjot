<script lang="ts">
  import "@fontsource-variable/atkinson-hyperlegible-next";
  import "@fontsource/ia-writer-quattro/400.css";
  import "@fontsource/ia-writer-quattro/700.css";
  import "@fontsource/ia-writer-quattro/400-italic.css";
  import "$lib/theme.css";
  import { onMount } from "svelte";
  import { getSettings, isLinux, onSettingsChanged } from "$lib/api";
  import { setLanguage } from "$lib/i18n.svelte";

  let { children } = $props();

  /**
   * WebKitGTK does not bind Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y in text fields (the app embedding it
   * has to), so run the field's own undo/redo. The editor handles its own keys and prevents them.
   */
  function onUndoKey(e: KeyboardEvent) {
    if (!isLinux || e.defaultPrevented || e.isComposing || !e.ctrlKey || e.altKey || e.metaKey) return;
    if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) return;
    const key = e.key.toLowerCase();
    const command = key === "z" ? (e.shiftKey ? "redo" : "undo") : key === "y" ? "redo" : null;
    if (!command) return;
    e.preventDefault();
    document.execCommand(command);
  }

  function applyLanguage() {
    getSettings()
      .then((s) => setLanguage(s.language))
      .catch(() => setLanguage("auto"));
  }

  onMount(() => {
    applyLanguage();
    // Pick up a new language in every window.
    const off = onSettingsChanged(applyLanguage);
    return () => off.then((f) => f());
  });
</script>

<svelte:window onkeydown={onUndoKey} />

{@render children()}
