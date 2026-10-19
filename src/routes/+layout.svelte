<script lang="ts">
  import "@fontsource-variable/atkinson-hyperlegible-next";
  import "@fontsource/ia-writer-quattro/400.css";
  import "@fontsource/ia-writer-quattro/700.css";
  import "@fontsource/ia-writer-quattro/400-italic.css";
  import "$lib/theme.css";
  import { onMount } from "svelte";
  import { getSettings, onNotesChanged } from "$lib/api";
  import { setLanguage } from "$lib/i18n.svelte";

  let { children } = $props();

  function applyLanguage() {
    getSettings()
      .then((s) => setLanguage(s.language))
      .catch(() => setLanguage("auto"));
  }

  onMount(() => {
    applyLanguage();
    // Settings changes also emit notes-changed; pick up a new language in every window.
    const off = onNotesChanged(applyLanguage);
    return () => off.then((f) => f());
  });
</script>

{@render children()}
