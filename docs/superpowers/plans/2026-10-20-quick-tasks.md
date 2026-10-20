# Quick Tasks (v0.2.0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture tasks from the quick box into one Tasks page, list every open task across all notes in a new notebook view, and fix #27.

**Architecture:** All parsing and file changes live in `src-tauri/src/store.rs` (no Tauri dependency, unit-tested). Thin Tauri commands in `commands.rs` add settings handling and events. The Svelte frontend gets one new view component (`TasksView.svelte`), a sidebar row, and quick-box changes.

**Tech Stack:** Tauri 2, Rust (chrono, serde), SvelteKit 5 (runes), TypeScript, @lucide/svelte icons.

**Spec:** `docs/superpowers/specs/2026-10-20-quick-tasks-design.md` (read it first).

## Global Constraints

- Notes stay plain Markdown; every write goes through `atomic_write`; every UI path is validated by `resolve`/`existing` in `store.rs`.
- A task line is `^\s*[-*+] \[ \] (.+)$`; lines inside ``` or ~~~ fences are ignored.
- Tasks page file name: `Tasks.md` (EN) / `Görevler.md` (TR), chosen once, stored as setting `tasksPage`.
- Commands that scan every file are `#[tauri::command(async)]`.
- Every UI string exists in both `en` and `tr` in `src/lib/i18n.svelte.ts`.
- Conventional commits. The commit examples end with a Sonnet 5.5 `Co-Authored-By` line; if your session's attribution reminder gives a different line, use that one instead.
- Work on a branch `feat/quick-tasks` from `main`; never push to `main` directly; open one PR at the end (Task 8).
- Run Rust commands from `src-tauri/` with `~/.cargo/bin/cargo`; Node v22 via nvm.

---

### Task 1: #27, the quick box ignores input while saving or saved

**Files:**
- Modify: `src/routes/quick/+page.svelte` (functions `save`, `onKeydown`; the `<textarea>`)

**Interfaces:** none.

- [ ] **Step 1: Create the branch**

```bash
cd ~/flashjot && git checkout main && git pull --ff-only && git checkout -b feat/quick-tasks
```

- [ ] **Step 2: Block keys while saving or saved**

In `onKeydown`, make the first line:

```ts
    if (status === "saving" || status === "saved") {
      e.preventDefault();
      return;
    }
```

In `save()`, change the guard to:

```ts
    if (!text.trim() || status === "saving" || status === "saved") return;
```

- [ ] **Step 3: Make the text area read-only instead of disabled**

Replace `disabled={status === "saving"}` on the `<textarea>` with:

```svelte
    readonly={status === "saving" || status === "saved"}
```

(`readonly` keeps focus in the box, so nothing typed leaks elsewhere, and `bind:value` cannot change.)

- [ ] **Step 4: Check**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/quick/+page.svelte
git commit -m "fix(quick): ignore typing while the note is being saved

Fixes #27

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Parse tasks and append them to the Tasks page (store)

**Files:**
- Modify: `src-tauri/src/store.rs` (new pub fn `parse_tasks`, new method `Store::add_tasks`, tests in `mod tests`)

**Interfaces:**
- Produces: `pub fn parse_tasks(text: &str) -> Option<Vec<String>>`
- Produces: `impl Store { pub fn add_tasks(&self, stored: Option<&str>, default_title: &str, tasks: &[String]) -> Result<String, StoreError> }` returning the Tasks page path relative to the root.

- [ ] **Step 1: Write the failing tests** (append inside `mod tests` in `store.rs`; helpers `store()` already exist there)

```rust
    #[test]
    fn parse_tasks_needs_the_prefix() {
        assert_eq!(parse_tasks("milk"), None);
        assert_eq!(parse_tasks("[x] milk"), None);
        assert_eq!(parse_tasks("[]milk"), None);
        assert_eq!(parse_tasks("[] milk"), Some(vec!["milk".to_string()]));
        assert_eq!(parse_tasks("  [ ] milk  "), Some(vec!["milk".to_string()]));
        assert_eq!(parse_tasks("[]"), Some(vec![]));
    }

    #[test]
    fn parse_tasks_makes_one_task_per_line() {
        let got = parse_tasks("[] süt al\n\nekmek\n- [ ] Ali'yi ara\n- yumurta\n[] -5 derece").unwrap();
        assert_eq!(got, ["süt al", "ekmek", "Ali'yi ara", "yumurta", "-5 derece"]);
    }

    #[test]
    fn add_tasks_creates_the_page_then_appends() {
        let (d, s) = store();
        let p = s.add_tasks(None, "Görevler", &["süt".into()]).unwrap();
        assert_eq!(p, "Görevler.md");
        let p2 = s.add_tasks(Some(p.as_str()), "Tasks", &["ekmek".into(), "çay".into()]).unwrap();
        assert_eq!(p2, "Görevler.md", "the stored page wins over the title of the new language");
        assert_eq!(fs::read_to_string(d.path().join("Görevler.md")).unwrap(), "- [ ] süt\n- [ ] ekmek\n- [ ] çay\n");
        assert!(!d.path().join("Tasks.md").exists());
    }

    #[test]
    fn add_tasks_reuses_a_users_page_and_adds_a_missing_newline() {
        let (d, s) = store();
        fs::write(d.path().join("Tasks.md"), "# My tasks\n- [x] done").unwrap();
        let p = s.add_tasks(None, "Tasks", &["new".into()]).unwrap();
        assert_eq!(p, "Tasks.md");
        assert_eq!(fs::read_to_string(d.path().join("Tasks.md")).unwrap(), "# My tasks\n- [x] done\n- [ ] new\n");
    }

    #[test]
    fn add_tasks_falls_back_when_the_stored_page_is_gone() {
        let (d, s) = store();
        let p = s.add_tasks(Some("Old/Gone.md"), "Tasks", &["a".into()]).unwrap();
        assert_eq!(p, "Tasks.md");
        assert!(d.path().join("Tasks.md").is_file());
    }

    #[test]
    fn add_tasks_rejects_an_empty_list() {
        let (_d, s) = store();
        assert!(matches!(s.add_tasks(None, "Tasks", &[]), Err(StoreError::Empty)));
    }
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd src-tauri && ~/.cargo/bin/cargo test parse_tasks add_tasks`
Expected: compile errors `cannot find function parse_tasks` / `no method named add_tasks`.

- [ ] **Step 3: Implement**

Add this free function next to `title_from_text` in `store.rs`:

```rust
/// Tasks from quick-box text that starts with "[]" or "[ ]"; `None` when it doesn't, so the
/// text is saved as an Inbox note instead. Every non-empty line becomes one task, without a
/// leading "- [ ] ", "[ ] ", "[] " or "- ".
pub fn parse_tasks(text: &str) -> Option<Vec<String>> {
    // A marker counts only when a space or the end of the line follows it.
    fn strip<'a>(s: &'a str, marker: &str) -> Option<&'a str> {
        s.strip_prefix(marker).filter(|r| r.is_empty() || r.starts_with(char::is_whitespace))
    }
    let first = text.trim_start();
    strip(first, "[]").or_else(|| strip(first, "[ ]"))?;
    let tasks = text
        .lines()
        .filter_map(|line| {
            let line = line.trim_start();
            let rest = ["- [ ]", "[ ]", "[]", "-"].iter().find_map(|m| strip(line, m)).unwrap_or(line);
            let rest = rest.trim();
            (!rest.is_empty()).then(|| rest.to_string())
        })
        .collect();
    Some(tasks)
}
```

Add this method inside `impl Store`, after `add_inbox`:

```rust
    /// Appends one "- [ ] task" line per task to the Tasks page and returns its path. `stored`
    /// is the page remembered in settings; when it is unset or gone, `<root>/<default_title>.md`
    /// is used, and created if it doesn't exist yet.
    pub fn add_tasks(&self, stored: Option<&str>, default_title: &str, tasks: &[String]) -> Result<String, StoreError> {
        if tasks.is_empty() {
            return Err(StoreError::Empty);
        }
        let path = match stored.and_then(|rel| self.existing(rel).ok()) {
            Some(path) => path,
            None => self.root.join(format!("{}.md", valid_name(default_title)?)),
        };
        let mut content = match fs::read_to_string(&path) {
            Ok(c) => c,
            Err(e) if e.kind() == io::ErrorKind::NotFound => String::new(),
            Err(e) => return Err(e.into()),
        };
        if !content.is_empty() && !content.ends_with('\n') {
            content.push('\n');
        }
        for task in tasks {
            content.push_str(&format!("- [ ] {task}\n"));
        }
        atomic_write(&path, &content)?;
        Ok(rel_string(&self.root, &path))
    }
```

- [ ] **Step 4: Run the tests**

Run: `~/.cargo/bin/cargo test`
Expected: all pass (31 existing + 6 new).

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/store.rs
git commit -m "feat(store): parse quick-box tasks and append them to the Tasks page

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Open tasks and ticking (store)

**Files:**
- Modify: `src-tauri/src/store.rs` (structs `Task`, `TaskGroup`; fns `open_tasks_in`, `task_text`; methods `Store::open_tasks`, `Store::set_task`; tests)

**Interfaces:**
- Produces: `#[derive(Debug, Serialize, PartialEq)] pub struct Task { pub line: usize, pub text: String }`
- Produces: `#[derive(Debug, Serialize)] pub struct TaskGroup { pub path: String, pub title: String, pub modified: i64, pub tasks: Vec<Task> }`
- Produces: `impl Store { pub fn open_tasks(&self, first: Option<&str>) -> Result<Vec<TaskGroup>, StoreError> }` (`first` = the Tasks page path, listed first)
- Produces: `impl Store { pub fn set_task(&self, rel: &str, line: usize, text: &str, done: bool) -> Result<(), StoreError> }` (`StoreError::Conflict` when the line no longer matches)

- [ ] **Step 1: Write the failing tests**

```rust
    #[test]
    fn open_tasks_in_finds_unchecked_tasks_outside_code() {
        let text = "# T\n- [ ] one\n  * [ ] nested\n+ [ ] plus\n- [x] done\n- [X] done too\n```\n- [ ] in code\n```\n~~~\n- [ ] tilde code\n~~~\n- [ ]   \n-[ ] no space\n- [ ] last";
        let tasks = open_tasks_in(text);
        let got: Vec<(usize, &str)> = tasks.iter().map(|t| (t.line, t.text.as_str())).collect();
        assert_eq!(got, [(1, "one"), (2, "nested"), (3, "plus"), (14, "last")]);
    }

    #[test]
    fn open_tasks_groups_by_page_with_the_tasks_page_first() {
        let (d, s) = store();
        fs::create_dir_all(d.path().join("Work")).unwrap();
        fs::write(d.path().join("Work/Plan.md"), "- [ ] ship\n").unwrap();
        fs::write(d.path().join("Tasks.md"), "- [ ] milk\n- [x] bread\n").unwrap();
        fs::write(d.path().join("Notes.md"), "no tasks here\n").unwrap();
        fs::create_dir_all(d.path().join(".trash")).unwrap();
        fs::write(d.path().join(".trash/Old.md"), "- [ ] deleted\n").unwrap();
        let groups = s.open_tasks(Some("Tasks.md")).unwrap();
        let paths: Vec<&str> = groups.iter().map(|g| g.path.as_str()).collect();
        assert_eq!(paths, ["Tasks.md", "Work/Plan.md"]);
        assert_eq!(groups[0].tasks, [Task { line: 0, text: "milk".into() }]);
        assert_eq!(groups[1].title, "Plan");
    }

    #[test]
    fn set_task_ticks_and_unticks_the_right_line() {
        let (d, s) = store();
        let p = d.path().join("Tasks.md");
        fs::write(&p, "- [ ] a\r\n  - [ ] b\n- [ ] c").unwrap();
        s.set_task("Tasks.md", 1, "b", true).unwrap();
        assert_eq!(fs::read_to_string(&p).unwrap(), "- [ ] a\r\n  - [x] b\n- [ ] c");
        s.set_task("Tasks.md", 1, "b", false).unwrap();
        s.set_task("Tasks.md", 2, "c", true).unwrap();
        assert_eq!(fs::read_to_string(&p).unwrap(), "- [ ] a\r\n  - [ ] b\n- [x] c");
    }

    #[test]
    fn set_task_refuses_when_the_line_changed() {
        let (d, s) = store();
        fs::write(d.path().join("Tasks.md"), "- [ ] a\n- [ ] b\n").unwrap();
        assert!(matches!(s.set_task("Tasks.md", 0, "b", true), Err(StoreError::Conflict)));
        assert!(matches!(s.set_task("Tasks.md", 9, "a", true), Err(StoreError::Conflict)));
        assert!(matches!(s.set_task("Tasks.md", 0, "a", false), Err(StoreError::Conflict)), "already open");
        assert!(matches!(s.set_task("../x.md", 0, "a", true), Err(StoreError::InvalidPath)));
    }
```

- [ ] **Step 2: Run them to see them fail**

Run: `~/.cargo/bin/cargo test open_tasks set_task`
Expected: compile errors (`open_tasks_in`, `Task`, `open_tasks`, `set_task` not found).

- [ ] **Step 3: Implement**

Add the structs next to `Hit`:

```rust
#[derive(Debug, Serialize, PartialEq)]
pub struct Task {
    /// 0-based line in the file; with `text`, identifies the task for `set_task`.
    pub line: usize,
    pub text: String,
}

#[derive(Debug, Serialize)]
pub struct TaskGroup {
    pub path: String,
    pub title: String,
    pub modified: i64,
    pub tasks: Vec<Task>,
}
```

Add the free functions next to `parse_tasks`:

```rust
/// Unchecked task lines ("- [ ] text", also with * or + and indentation), skipping fenced code.
pub fn open_tasks_in(text: &str) -> Vec<Task> {
    let mut out = Vec::new();
    let mut fence: Option<&str> = None;
    for (line, raw) in text.lines().enumerate() {
        let trimmed = raw.trim_start();
        if let Some(f) = fence {
            if trimmed.starts_with(f) {
                fence = None;
            }
            continue;
        }
        if let Some(f) = ["```", "~~~"].into_iter().find(|f| trimmed.starts_with(f)) {
            fence = Some(f);
            continue;
        }
        if let Some(text) = task_text(trimmed) {
            out.push(Task { line, text: text.to_string() });
        }
    }
    out
}

fn task_text(trimmed: &str) -> Option<&str> {
    let rest = trimmed.strip_prefix(['-', '*', '+'])?.strip_prefix(" [ ] ")?.trim();
    (!rest.is_empty()).then_some(rest)
}
```

Add the methods inside `impl Store`, after `search`:

```rust
    /// Every page with unchecked tasks: `first` (the Tasks page) first, then newest first.
    pub fn open_tasks(&self, first: Option<&str>) -> Result<Vec<TaskGroup>, StoreError> {
        let mut files = Vec::new();
        collect_md(&self.root, &mut files)?;
        let mut groups = Vec::new();
        for path in files {
            let tasks = open_tasks_in(&fs::read_to_string(&path).unwrap_or_default());
            if tasks.is_empty() {
                continue;
            }
            let meta = self.meta(&path)?;
            groups.push(TaskGroup { path: meta.path, title: meta.title, modified: meta.modified, tasks });
        }
        groups.sort_by_key(|g| (Some(g.path.as_str()) != first, std::cmp::Reverse(g.modified)));
        Ok(groups)
    }

    /// Ticks (`done`) or unticks the task on `line`. Refuses with `Conflict` unless that line is
    /// still the open (or done) task with this `text`, e.g. after the file changed elsewhere.
    pub fn set_task(&self, rel: &str, line: usize, text: &str, done: bool) -> Result<(), StoreError> {
        let path = self.existing(rel)?;
        let content = fs::read_to_string(&path)?;
        // split_inclusive keeps each line's own ending ("\n" or "\r\n").
        let mut lines: Vec<&str> = content.split_inclusive('\n').collect();
        let current = *lines.get(line).ok_or(StoreError::Conflict)?;
        let trimmed = current.trim_start();
        let indent = &current[..current.len() - trimmed.len()];
        let bullet = trimmed.chars().next().filter(|c| matches!(c, '-' | '*' | '+')).ok_or(StoreError::Conflict)?;
        let boxes: &[&str] = if done { &[" [ ] "] } else { &[" [x] ", " [X] "] };
        let rest = boxes.iter().find_map(|b| trimmed[1..].strip_prefix(b)).ok_or(StoreError::Conflict)?;
        if rest.trim() != text {
            return Err(StoreError::Conflict);
        }
        let updated = format!("{indent}{bullet} [{}] {rest}", if done { "x" } else { " " });
        lines[line] = &updated;
        atomic_write(&path, &lines.concat())?;
        Ok(())
    }
```

- [ ] **Step 4: Run the tests**

Run: `~/.cargo/bin/cargo test && ~/.cargo/bin/cargo clippy --all-targets`
Expected: all tests pass; clippy prints no warnings.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/store.rs
git commit -m "feat(store): list open tasks across notes and tick them in place

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Commands and the `tasksPage` setting

**Files:**
- Modify: `src-tauri/src/settings.rs` (field `tasks_page`, test)
- Modify: `src-tauri/src/commands.rs` (`add_quick_note`, new `QuickSaved`, `open_tasks`, `set_task`, `set_settings`)
- Modify: `src-tauri/src/lib.rs` (register commands)

**Interfaces:**
- Consumes: `parse_tasks`, `Store::add_tasks`, `Store::open_tasks`, `Store::set_task`, `TaskGroup` (Tasks 2–3)
- Produces (JSON over IPC):
  - `add_quick_note({ text, tasksTitle }) -> { kind: "note", path } | { kind: "tasks", path, count }`
  - `open_tasks() -> TaskGroup[]`
  - `set_task({ path, line, text, done }) -> void`, emits `notes-changed`; a conflict fails with `"note changed on disk"`.

- [ ] **Step 1: Write the failing settings test** (in `settings.rs` `mod tests`)

```rust
    #[test]
    fn old_settings_files_get_no_tasks_page() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("settings.json");
        fs::write(&p, r#"{"language":"tr"}"#).unwrap();
        assert_eq!(load(&p).tasks_page, None);
    }
```

Run: `~/.cargo/bin/cargo test old_settings_files_get_no_tasks_page`
Expected: compile error `no field tasks_page`.

- [ ] **Step 2: Add the setting**

In `struct Settings`, after `launch_at_login`:

```rust
    /// The Tasks page, relative to the notes folder; set when the first task is added.
    pub tasks_page: Option<String>,
```

In `impl Default for Settings`, add `tasks_page: None,`.

Run: `~/.cargo/bin/cargo test`
Expected: all pass.

- [ ] **Step 3: Commands**

In `commands.rs`, extend the imports:

```rust
use crate::store::{self, Hit, Note, NoteMeta, Store, TaskGroup, Tree};
use serde::Serialize;
```

Replace `add_quick_note` with:

```rust
/// What the quick box saved: an Inbox note, or tasks (text starting with "[]") on the Tasks page.
#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum QuickSaved {
    Note { path: String },
    Tasks { path: String, count: usize },
}

/// `tasks_title` is the Tasks page title in the UI language, used when the page is first created.
#[tauri::command]
pub fn add_quick_note(app: AppHandle, state: State<AppState>, text: String, tasks_title: String) -> CmdResult<QuickSaved> {
    let saved = match store::parse_tasks(&text) {
        None => {
            let now = chrono::Local::now().naive_local();
            let meta = with_store(&state, |s| s.add_inbox(&text, now))?;
            QuickSaved::Note { path: meta.path }
        }
        // Only "[]": nothing to save, the box stays open.
        Some(tasks) if tasks.is_empty() => return Ok(QuickSaved::Tasks { path: String::new(), count: 0 }),
        Some(tasks) => {
            let stored = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
            let path = with_store(&state, |s| s.add_tasks(stored.as_deref(), &tasks_title, &tasks))?;
            if stored.as_deref() != Some(path.as_str()) {
                let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
                settings.tasks_page = Some(path.clone());
                settings::save(&state.settings_path, &settings).map_err(|e| e.to_string())?;
            }
            QuickSaved::Tasks { path, count: tasks.len() }
        }
    };
    changed(&app);
    Ok(saved)
}
```

Add after `search_notes`:

```rust
#[tauri::command(async)]
pub fn open_tasks(state: State<AppState>) -> CmdResult<Vec<TaskGroup>> {
    let first = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
    with_store(&state, |s| s.open_tasks(first.as_deref()))
}

#[tauri::command(async)]
pub fn set_task(app: AppHandle, state: State<AppState>, path: String, line: usize, text: String, done: bool) -> CmdResult<()> {
    with_store(&state, |s| s.set_task(&path, line, &text, done))?;
    changed(&app);
    Ok(())
}
```

In `set_settings`, the UI never edits `tasks_page`, so keep the stored one. Change the signature's `settings: Settings` to `mut settings: Settings` and make this the first line of the body:

```rust
    settings.tasks_page = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
```

In `lib.rs`, add `commands::open_tasks,` and `commands::set_task,` to `generate_handler!` after `commands::search_notes,`.

- [ ] **Step 4: Build and test**

Run: `~/.cargo/bin/cargo test && ~/.cargo/bin/cargo clippy --all-targets`
Expected: all pass, no warnings.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src
git commit -m "feat: commands for quick tasks and the open tasks list

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Quick box saves tasks

**Files:**
- Modify: `src/lib/api.ts`
- Modify: `src/lib/i18n.svelte.ts` (keys in both `en` and `tr`)
- Modify: `src/routes/quick/+page.svelte`

**Interfaces:**
- Consumes: `add_quick_note` from Task 4.
- Produces (TS, used by Tasks 6): `QuickSaved`, `Task`, `TaskGroup`, `openTasks()`, `setTask()`, `Settings.tasksPage`.

- [ ] **Step 1: API types and wrappers** in `src/lib/api.ts`

Add `tasksPage: string | null;` to `interface Settings`. Replace the `addQuickNote` line and add the task API:

```ts
export type QuickSaved = { kind: "note"; path: string } | { kind: "tasks"; path: string; count: number };
/** Text starting with "[]" is saved as tasks on the Tasks page, titled `tasksTitle` when new. */
export const addQuickNote = (text: string, tasksTitle: string) =>
  invoke<QuickSaved>("add_quick_note", { text, tasksTitle });

export interface Task {
  line: number;
  text: string;
}

export interface TaskGroup {
  path: string;
  title: string;
  modified: number;
  tasks: Task[];
}

export const openTasks = () => invoke<TaskGroup[]>("open_tasks");
/** Fails with CONFLICT if that line is no longer this task. */
export const setTask = (path: string, line: number, text: string, done: boolean) =>
  invoke<void>("set_task", { path, line, text, done });
```

- [ ] **Step 2: Strings** in `src/lib/i18n.svelte.ts`

In `en`, after `"quick.saved"`:

```ts
  "quick.savedTasks": "Added to Tasks",
  "quick.task": "task",
  "tasks.pageTitle": "Tasks",
  "nb.openTasks": "Open tasks",
  "nb.tasksHint": "Every unchecked task in your notes. Tick one when it's done.",
  "nb.tasksEmpty": "No open tasks. Start a quick note with [] to add one.",
  "nb.taskChanged": "This task changed. Reloaded the list.",
```

In `tr`, after `"quick.saved"`:

```ts
  "quick.savedTasks": "Görevlere eklendi",
  "quick.task": "görev",
  "tasks.pageTitle": "Görevler",
  "nb.openTasks": "Açık görevler",
  "nb.tasksHint": "Notlarındaki işaretlenmemiş tüm görevler. Bitince işaretle.",
  "nb.tasksEmpty": "Açık görev yok. Hızlı notu [] ile başlatarak görev ekle.",
  "nb.taskChanged": "Bu görev değişmiş. Liste yenilendi.",
```

- [ ] **Step 3: Quick box** in `src/routes/quick/+page.svelte`

Add next to `let status`:

```ts
  let savedAs = $state<"note" | "tasks">("note");
```

In `save()`, replace `await addQuickNote(text);` with:

```ts
      const saved = await addQuickNote(text, t("tasks.pageTitle"));
      if (saved.kind === "tasks" && saved.count === 0) {
        status = "idle";
        return;
      }
      savedAs = saved.kind;
```

In the footer, replace `✓ {t("quick.saved")}` with:

```svelte
✓ {t(savedAs === "tasks" ? "quick.savedTasks" : "quick.saved")}
```

and add a first hint inside `<span class="hints">`:

```svelte
        <span><kbd>[]</kbd> {t("quick.task")}</span>
```

- [ ] **Step 4: Check**

Run: `npm run check`
Expected: `0 ERRORS 0 WARNINGS`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/lib/i18n.svelte.ts src/routes/quick/+page.svelte
git commit -m "feat(quick): start a note with [] to add tasks to the Tasks page

Fixes #18

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Open tasks view in the notebook

**Files:**
- Create: `src/lib/components/TasksView.svelte`
- Modify: `src/lib/notebook.svelte.ts` (`View`, `tasks`, `openTaskCount`, `refresh`)
- Modify: `src/lib/components/Sidebar.svelte` (row + CSS)
- Modify: `src/routes/notebook/+page.svelte` (render the view)

**Interfaces:**
- Consumes: `openTasks`, `setTask`, `TaskGroup`, `CONFLICT` from `api.ts`; `nb.openPage`, `nb.notify`, `nb.error`.
- Produces: `View` kind `{ kind: "tasks" }`; `nb.tasks: TaskGroup[]`; `nb.openTaskCount: number`.

- [ ] **Step 1: Notebook state** in `src/lib/notebook.svelte.ts`

Change the import to `import type { Hit, NoteMeta, TaskGroup, Tree } from "$lib/api";`, add `| { kind: "tasks" }` to `View`, and add next to `inbox`:

```ts
  tasks = $state<TaskGroup[]>([]);
  openTaskCount = $derived(this.tasks.reduce((n, g) => n + g.tasks.length, 0));
```

In `refresh()`, replace the `Promise.all` line and the two assignments with:

```ts
      const [tree, inbox, tasks] = await Promise.all([api.getTree(), api.listInbox(), api.openTasks()]);
      this.tree = tree;
      this.inbox = inbox;
      this.tasks = tasks;
```

- [ ] **Step 2: The view** `src/lib/components/TasksView.svelte`

```svelte
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
    padding: 48px 32px;
  }

  header p,
  .empty {
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
```

Before committing, open `src/lib/components/InboxView.svelte` and `src/lib/theme.css`: if the CSS tokens are named differently from `--muted`, `--step-0`, use the names those files use (the Inbox header uses the same muted hint text) so light and dark themes both work.

- [ ] **Step 3: Sidebar row** in `src/lib/components/Sidebar.svelte`

Add `ListChecks` to the `@lucide/svelte` import. Right after the Inbox `<button class="row inbox" …>…</button>`, add:

```svelte
      <button class="row inbox last" class:active={nb.view.kind === "tasks"} onclick={() => nb.show({ kind: "tasks" })}>
        <ListChecks size={16} aria-hidden="true" />
        <span class="title">{t("nb.openTasks")}</span>
        {#if nb.openTaskCount}<span class="count">{nb.openTaskCount}</span>{/if}
      </button>
```

In the `<style>` block, replace the `.inbox` rule with:

```css
  .inbox {
    font-weight: 600;
  }

  .inbox.last {
    margin-bottom: 10px;
  }
```

- [ ] **Step 4: Render it** in `src/routes/notebook/+page.svelte`

Import `TasksView from "$lib/components/TasksView.svelte"` and add before `{:else if nb.view.kind === "settings"}`:

```svelte
    {:else if nb.view.kind === "tasks"}
      <TasksView />
```

- [ ] **Step 5: Check, build, try it**

Run: `npm run check && npm run build`
Expected: 0 errors; build succeeds.
Then `npm run tauri dev`, and with a throwaway notes folder: add `[] süt` from the quick box (Ctrl+Alt+N) → "Görevlere eklendi"/"Added to Tasks"; open the notebook → "Open tasks" shows the count and the task; tick it → struck through, file shows `- [x]`; tick again → back to `- [ ]`.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/TasksView.svelte src/lib/notebook.svelte.ts src/lib/components/Sidebar.svelte src/routes/notebook/+page.svelte
git commit -m "feat(notebook): Open tasks view with every unchecked task across notes

Fixes #19

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Docs, manual test list, version 0.2.0

**Files:**
- Modify: `docs-site/src/content/docs/guide/quick-capture.md`, `docs-site/src/content/docs/tr/guide/quick-capture.md`
- Modify: `docs-site/src/content/docs/guide/notebook.md`, `docs-site/src/content/docs/tr/guide/notebook.md`
- Modify: `docs-site/src/content/docs/roadmap.md` (move the v0.2 items to a "Done in 0.2" line)
- Modify: `docs/manual-test.md`, `README.md`, `CHANGELOG.md`
- Modify: `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`

- [ ] **Step 1: User docs** (match each file's existing tone and heading levels)

`quick-capture.md` (EN), new section:

```markdown
## Tasks

Start the text with `[]` (or `[ ]`) and press Enter to add tasks instead of a note. Every line
becomes one task, so `[] milk`, then Shift+Enter, then `bread` adds two. Tasks go to the
**Tasks** page at the top of your notes folder as ordinary Markdown checkboxes (`- [ ] milk`).
The page is created with the first task. If you rename or move it, Flashjot starts a new one.
```

`tr/guide/quick-capture.md`:

```markdown
## Görevler

Not yerine görev eklemek için metne `[]` (ya da `[ ]`) ile başla ve Enter'a bas. Her satır bir
görev olur: `[] süt`, Shift+Enter, `ekmek` iki görev ekler. Görevler not klasörünün en üstündeki
**Görevler** sayfasına sıradan Markdown kutucukları olarak eklenir (`- [ ] süt`). Sayfa ilk
görevle oluşturulur. Adını değiştirir ya da taşırsan Flashjot yeni bir sayfa açar.
```

`notebook.md` (EN), new section:

```markdown
## Open tasks

**Open tasks** in the sidebar lists every unchecked task (`- [ ]`) in all your notes, grouped by
page, with the Tasks page first. Tick a task to mark it done in its file; it stays on the list,
struck through, until you leave the view, so a second click undoes it. Click a task or a page
title to open the page. Tasks inside code blocks are ignored.
```

`tr/guide/notebook.md`:

```markdown
## Açık görevler

Kenar çubuğundaki **Açık görevler**, tüm notlarındaki işaretlenmemiş görevleri (`- [ ]`) sayfalara
göre gruplu listeler; Görevler sayfası en üsttedir. Bir görevi işaretleyince dosyasında da
tamamlanır; görünümden çıkana kadar üstü çizili olarak listede kalır, ikinci tıklama geri alır.
Bir göreve ya da sayfa adına tıklayınca sayfa açılır. Kod bloklarının içindeki görevler sayılmaz.
```

- [ ] **Step 2: Manual test list** — add to `docs/manual-test.md` under "Quick box":

```markdown
- [ ] `[] süt` + Enter shows "Added to Tasks" / "Görevlere eklendi"; the Tasks page has `- [ ] süt`.
- [ ] `[] a`, Shift+Enter, `b` adds two tasks; plain text still goes to the Inbox.
- [ ] Only `[]` + Enter saves nothing and keeps the box open.
- [ ] Right after Enter, typing or pressing Enter again changes nothing (#27); the next Ctrl+Alt+N opens an empty box.
```

and under "Notebook":

```markdown
- [ ] "Open tasks" shows the count; lists tasks from several pages, Tasks page first; code-block tasks are not listed.
- [ ] Ticking marks `[x]` in the file and strikes the row through; ticking again restores `[ ]`.
- [ ] Editing the task line elsewhere, then ticking it, shows "This task changed" and reloads the list.
```

- [ ] **Step 3: README, roadmap, changelog**

README: in the features list add a bullet "**Tasks:** start a quick note with `[]` to add tasks; *Open tasks* lists every unchecked task across your notes." and remove the v0.2 quick-tasks line from the Roadmap list. In `docs-site/src/content/docs/roadmap.md` replace the "## Next: v0.2" section with "## Done in 0.2" and one line linking #18 and #19.

`CHANGELOG.md`, add above `## [0.1.1]`:

```markdown
## [0.2.0] - YYYY-MM-DD

### Added

- Start a quick note with `[]` to add tasks to a Tasks page instead of the Inbox. Every line
  becomes one task. (#18)
- **Open tasks** in the notebook lists every unchecked task across your notes, grouped by page.
  Tick a task to mark it done in its file. (#19)

### Fixed

- The quick box ignores typing while a note is being saved, so nothing typed in that moment ends
  up in the next note or saves a second one. (#27)
```

(Use the actual date of the release for `YYYY-MM-DD`.)

- [ ] **Step 4: Version 0.2.0**

```bash
npm version 0.2.0 --no-git-tag-version
sed -i 's/^version = "0.1.1"/version = "0.2.0"/' src-tauri/Cargo.toml
sed -i 's/"version": "0.1.1"/"version": "0.2.0"/' src-tauri/tauri.conf.json
(cd src-tauri && ~/.cargo/bin/cargo check)   # updates Cargo.lock
grep -rn "0\.1\.1" docs-site/src/content | grep -i appimage   # update example file names to 0.2.0
```

- [ ] **Step 5: Verify everything**

Run:
```bash
(cd src-tauri && ~/.cargo/bin/cargo test && ~/.cargo/bin/cargo clippy --all-targets)
npm run check && npm run build
(cd docs-site && npm run build)
```
Expected: all tests pass, no clippy warnings, 0 check errors, both builds succeed.

- [ ] **Step 6: Commit**

```bash
git add -A docs docs-site/src README.md CHANGELOG.md package.json package-lock.json src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/tauri.conf.json
git commit -m "chore: release 0.2.0

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Pull request

- [ ] **Step 1: Push the branch and open the PR** (do not merge; the maintainer reviews and merges)

```bash
git push -u origin feat/quick-tasks
gh pr create --base main --head feat/quick-tasks --milestone v0.2.0 --label enhancement \
  --title "v0.2.0: quick tasks and the Open tasks view" \
  --body "Implements docs/superpowers/specs/2026-10-20-quick-tasks-design.md.

Fixes #18
Fixes #19
Fixes #27

## Testing
- cargo test / clippy, npm run check / build, docs build: all green (paste the summary lines)
- Manual: the new steps in docs/manual-test.md (list which ones you ran)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

- [ ] **Step 2: Report** the PR URL, the commit list, and anything from the manual test list that was not run.
