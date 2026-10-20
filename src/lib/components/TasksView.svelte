<script lang="ts">
  // A snapshot of the open tasks taken when the view opens. Ticked rows stay (struck through)
  // until the view is opened again, so a mis-click can be undone with a second click.
  import { CONFLICT, openTasks, setTask, type TaskGroup } from "$lib/api";
  import { t } from "$lib/i18n.svelte";
  import { nb } from "$lib/notebook.svelte";
  import { onMount } from "svelte";

  let groups = $state<TaskGroup[]>([]);
  let done = $state<Record<string, boolean>>({});
  let loaded = $state(false);

  async function load() {
    try {
      groups = await openTasks();
      done = {};
    } catch (e) {
      nb.error(e);
    }
    loaded = true;
  }

  async function toggle(path: string, line: number, text: string) {
    const key = `${path}:${line}`;
    const next = !done[key];
    try {
      await setTask(path, line, text, next);
      done[key] = next;
    } catch (e) {
      if (String(e).includes(CONFLICT)) {
        nb.notify(t("nb.taskChanged"));
        await load();
      } else {
        nb.error(e);
      }
    }
  }

  onMount(load);
</script>

<section class="tasks">
  <header>
    <h1>{t("nb.openTasks")}</h1>
    <p>{t("nb.tasksHint")}</p>
  </header>

  {#if loaded && groups.length === 0}
    <p class="empty">{t("nb.tasksEmpty")}</p>
  {/if}

  {#each groups as group (group.path)}
    <section class="group">
      <h2><button class="link" onclick={() => nb.openPage(group.path)}>{group.title}</button></h2>
      <ul>
        {#each group.tasks as task (task.line)}
          {@const key = `${group.path}:${task.line}`}
          <li class:done={done[key]}>
            <input
              type="checkbox"
              checked={done[key] ?? false}
              aria-label={task.text}
              onchange={() => toggle(group.path, task.line, task.text)}
            />
            <button class="link text" onclick={() => nb.openPage(group.path)}>{task.text}</button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</section>

<style>
  .tasks {
    max-width: 46rem;
    margin: 0 auto;
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

  .group {
    margin-top: 28px;
  }

  h2 {
    margin: 0 0 8px;
    font-size: var(--step-0);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: baseline;
    gap: 10px;
    padding: 6px 0;
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .link:hover {
    text-decoration: underline;
  }

  li.done .text {
    color: var(--muted);
    text-decoration: line-through;
  }
</style>
