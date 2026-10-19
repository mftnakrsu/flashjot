<script lang="ts">
  import { nb } from "$lib/notebook.svelte";
</script>

<div class="slot" aria-live="polite">
  {#if nb.toast}
    <div class="toast" class:error={nb.toast.tone === "error"} role={nb.toast.tone === "error" ? "alert" : "status"}>
      <span>{nb.toast.message}</span>
      {#if nb.toast.action}
        {@const action = nb.toast.action}
        <button
          onclick={() => {
            nb.toast = null;
            action.run();
          }}>{action.label}</button
        >
      {/if}
    </div>
  {/if}
</div>

<style>
  .slot {
    position: fixed;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    z-index: 10;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 9px 14px;
    border-radius: 10px;
    background: var(--graphite);
    color: var(--paper);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.2);
    animation: rise 160ms ease-out;
  }

  .toast.error {
    background: var(--danger);
    color: #fff;
  }

  button {
    border: 0;
    background: none;
    color: inherit;
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @keyframes rise {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
  }
</style>
