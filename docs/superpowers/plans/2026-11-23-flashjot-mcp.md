# flashjot-mcp (MCP server) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `flashjot-mcp`, a stdio MCP server that lets AI agents capture, read, search and organise a Flashjot notebook with the app's own rules, plus the folder watching (#21) the app needs to show what agents write.

**Architecture:** The repository becomes a Cargo workspace. `store.rs` and `settings.rs` move unchanged into a new Tauri-free crate, `crates/core` (`flashjot-core`), together with the code that finds the notes folder. The app (`src-tauri`) and the new `crates/mcp` (`flashjot-mcp`, built on the official Rust MCP SDK `rmcp`) both depend on it. The app gains a folder watcher that emits the existing `notes-changed` event. Release builds bundle the server next to the app through Tauri's `externalBin`, from a release-only config file.

**Tech Stack:** Rust (edition 2024, Rust 1.90+), Cargo workspace, Tauri 2, `rmcp` 3.11 (features `server`, `macros`, `transport-io`), `tokio` 1, `notify-debouncer-mini` 0.8 (notify 9), `sys-locale` 0.3, SvelteKit 5, Astro Starlight (docs site).

**Spec:** `docs/superpowers/specs/2026-11-23-flashjot-mcp-design.md` (read it first; this plan argues from it).

## Global Constraints

- Notes stay plain Markdown. Every write goes through `atomic_write`; every path from outside (UI or agent) is validated by the store (`resolve`, `existing`, `folder_dir`, `check_rel`).
- One copy of the note rules: `flashjot-mcp` calls `flashjot_core::store` functions only; it adds no file logic of its own.
- `flashjot-mcp` **never writes the settings file** (reads it with `settings::peek`, which does not even move a corrupt file).
- Agents can never delete permanently: no tool calls `empty_trash`.
- Tool names, exactly: `capture`, `list-inbox`, `list-notebook`, `read-note`, `search`, `open-tasks`, `set-task`, `write-note`, `create-folder`, `create-page`, `rename-note`, `move-note`, `trash-note`, `restore-note`.
- The server's stdout carries only MCP messages; logs go to stderr and never contain note text.
- Settings file: `<config dir>/io.github.mftnakrsu.flashjot/settings.json` (identifier from `src-tauri/tauri.conf.json`).
- Tasks page titles: `Tasks` (EN), `Görevler` (TR), as `tasks.pageTitle` in `src/lib/i18n.svelte.ts`.
- Every UI and docs string exists in English and Turkish.
- Conventional commits; every commit message ends with the `Co-Authored-By` line from your session's attribution reminder.
- One branch and one pull request per phase, from an up-to-date `main`; never push to `main` directly. Each phase's PR is merged before the next phase starts.
- Run Cargo from the repository root (it is a workspace after Task 1). Node v22 via nvm.

## Spec deviations and findings

Found while grounding this plan in the code (2026-11-23). The spec's direction is unchanged; these are corrections and details.

1. **`search` limit is at most 50, not 100.** `Store::search` already keeps only the 50 newest hits (`store.rs`, `take(50)`). The tool clamps `limit` to 1–50 (`SEARCH_MAX`); raising it would change the app's search too, which is out of scope.
2. **`settings::load` writes.** On a corrupt settings file it renames it to `settings.json.bak`. Since the server must never write settings, Task 6 adds `settings::peek`, a read-only loader. The spec's "never writes settings" rule depends on this.
3. **`write-note` needs `modified` and an existing note.** `Store::write` with `expected = None` overwrites blindly and creates missing files. The tool makes `modified` required and reads the note first, so a mistyped path returns "No note at …" instead of creating a file. New notes come from `create-page` (spec §3 implied this; now explicit).
4. **`externalBin` cannot live in `tauri.conf.json`.** `tauri-build` (2.7.3, `copy_binaries`) fails the app's build when a listed sidecar file is missing, which would break `cargo test` and `tauri dev` on a fresh clone. It goes in a release-only file, `src-tauri/tauri.mcp.conf.json`, merged with `tauri build --config`. `tauri-build` also copies the sidecar into the target folder as `flashjot-mcp`, the same name the workspace build gives the server binary; harmless because it is the same program, but `scripts/mcp-sidecar.mjs` always builds with `--target` so the two never share a folder.
5. **Folder watching and autosave.** Once the watcher runs, every autosave also produces a `notes-changed` event (after the 300 ms debounce). The frontend's `refresh()` reloads only lists (tree, Inbox, tasks), never the editor, so that is cheap. The editor itself reloads the open page only when its disk time differs from the one it holds and it has no unsaved text; its own saves therefore never reload it.
6. **The watcher must watch the canonical root.** macOS reports `/private/var/…` for `/var/…`; `watch_notes` canonicalizes the root before comparing event paths.
7. **Notes-folder changes need a client restart for the server.** The server resolves the notes folder once at start (as the spec says). If the user picks another folder in the app's Settings, MCP clients must restart the server; the docs page says so.
8. **rmcp 3.11 builds with edition 2024 and Rust 1.99** (`rust-version = 1.88`). Open question 2 of the spec is resolved.
9. **Tool annotations.** rmcp's `#[tool(annotations(...))]` lets the server mark read-only tools (`read_only_hint = true`) and the destructive ones (`write-note`, `trash-note`: `destructive_hint = true`). Clients use these to decide what to auto-approve. Not in the spec; added because it costs one attribute per tool.

## Compile-check status

Checked on 2026-11-23 in a scratch copy of the repository (Linux x86_64, rustc 1.99.1), not in this repository:

| Snippet | Status |
|---|---|
| Task 1: workspace `Cargo.toml`, `crates/core` (`lib.rs`, `location.rs` + tests), the `src-tauri` changes | compiled; `cargo test --workspace` passed (49 core + 2 app tests) |
| Task 3: `src-tauri/src/watch.rs` + its 3 tests | compiled and passed in a standalone crate (the file-event test used real inotify) |
| Task 4: `AppState.watch` and `watch_notes` wiring | compiled in the scratch app (Linux); `cargo clippy --workspace --all-targets -- -D warnings` clean; all workspace tests passed without `src-tauri/binaries/` present |
| Task 6: `settings::peek` + test | compiled, passed |
| Tasks 7–8: `crates/mcp` (`notebook.rs` with 15 tests, `server.rs`, `instructions.md`, `main.rs`, `tests/stdio.rs`) | compiled with no warnings; all 16 tests passed, including the end-to-end stdio test |
| Task 10: `.deb` with the sidecar (`npx tauri build --bundles deb --config src-tauri/tauri.mcp.conf.json`) | built; it holds `usr/bin/flashjot` and `usr/bin/flashjot-mcp` (release `flashjot-mcp` is 1.7 MB; `--version` works) |
| Task 5: Svelte changes | **not** checked (run `npm run check`) |
| Task 10: release workflow YAML, `scripts/mcp-sidecar.mjs`, the asset upload with `gh api` | **not** run (needs GitHub Actions; `gh api` with an absolute URL was checked against api.github.com only) |
| Task 11: docs pages | **not** built (run `npm run build` in `docs-site/`) |

## File map

| File | Phase | Responsibility |
|---|---|---|
| `Cargo.toml` (new, root) | 1 | Workspace: members, shared dependency versions, the release profile |
| `crates/core/Cargo.toml` | 1 | `flashjot-core` package |
| `crates/core/src/lib.rs` | 1 | Module list |
| `crates/core/src/store.rs` | 1 (moved) | Notes on disk (unchanged) |
| `crates/core/src/settings.rs` | 1 (moved), 3 | Settings file; Task 6 adds `peek` |
| `crates/core/src/location.rs` | 1 | `IDENTIFIER`, `settings_path`, `notes_root`, `default_root`, `open_store` |
| `src-tauri/Cargo.toml`, `src/lib.rs`, `src/commands.rs`, `src/shortcuts.rs` | 1 | Use `flashjot_core` |
| `src-tauri/src/watch.rs` | 2 | Folder watcher (no Tauri dependency) |
| `src-tauri/src/commands.rs`, `src/lib.rs` | 2 | Start and restart the watcher |
| `src/lib/notebook.svelte.ts`, `src/lib/editor/Editor.svelte` | 2 | Reload the open page when it changed on disk |
| `crates/mcp/Cargo.toml` | 3 | `flashjot-mcp` package |
| `crates/mcp/src/notebook.rs` | 3 | What each tool does, error messages, Tasks page choice (unit-tested, no MCP types) |
| `crates/mcp/src/server.rs` | 3 | rmcp tool router: arguments, descriptions, replies |
| `crates/mcp/src/instructions.md` | 3 | Server instructions sent at `initialize` |
| `crates/mcp/src/main.rs` | 3 | Arguments, open the notebook, serve stdio |
| `crates/mcp/tests/stdio.rs` | 3 | End-to-end test over stdio |
| `scripts/mcp-sidecar.mjs` | 4 | Build the server and place it where `externalBin` expects it |
| `src-tauri/tauri.mcp.conf.json` | 4 | Release-only config adding `externalBin` |
| `.github/workflows/ci.yml`, `release.yml` | 1, 4 | Workspace paths; sidecar and standalone server in releases |
| `docs-site/src/content/docs/guide/ai-agents.md`, `tr/guide/ai-agents.md` | 4 | Setup page EN and TR |
| `README.md`, `CHANGELOG.md`, `docs/manual-test.md`, development docs | 1–4 | Docs kept in step |

---

# Phase 1: the workspace and `flashjot-core` (PR 1, no behaviour change)

### Task 1: Move the note rules into `crates/core`

**Files:**
- Create: `Cargo.toml`, `crates/core/Cargo.toml`, `crates/core/src/lib.rs`, `crates/core/src/location.rs`
- Move: `src-tauri/src/store.rs` → `crates/core/src/store.rs`, `src-tauri/src/settings.rs` → `crates/core/src/settings.rs`, `src-tauri/Cargo.lock` → `Cargo.lock`
- Modify: `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs:1-6`, `src-tauri/src/shortcuts.rs:4`, `src-tauri/src/commands.rs:1-48` and its tests, `.gitignore`

**Interfaces:**
- Produces: crate `flashjot_core` with modules `store` (unchanged API: `Store`, `StoreError`, `NoteMeta`, `Note`, `Tree`, `Folder`, `Hit`, `Task`, `TaskGroup`, `parse_tasks`, `open_tasks_in`, `INBOX`, `TRASH`), `settings` (`Settings`, `load`, `save`), and `location`:
  - `pub const IDENTIFIER: &str = "io.github.mftnakrsu.flashjot";`
  - `pub fn settings_path() -> Option<PathBuf>`
  - `pub fn notes_root(s: &Settings) -> PathBuf`
  - `pub fn default_root() -> PathBuf`
  - `pub fn open_store(root: PathBuf, fallback: PathBuf) -> Store`

- [ ] **Step 1: Create the branch**

```bash
cd ~/flashjot && git checkout main && git pull --ff-only && git checkout -b refactor/core-crate
```

- [ ] **Step 2: Move the files with history**

```bash
mkdir -p crates/core/src
git mv src-tauri/src/store.rs crates/core/src/store.rs
git mv src-tauri/src/settings.rs crates/core/src/settings.rs
git mv src-tauri/Cargo.lock Cargo.lock
```

- [ ] **Step 3: Create the workspace manifest** `Cargo.toml` at the root:

```toml
[workspace]
members = ["src-tauri", "crates/core"]
resolver = "3"

[workspace.package]
edition = "2024"
license = "MIT"
repository = "https://github.com/mftnakrsu/flashjot"

[workspace.dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4.45", default-features = false, features = ["clock", "std"] }
dirs = "7.0.0"
tempfile = "3.27.0"

# Moved from src-tauri/Cargo.toml: Cargo reads profiles only from the workspace root.
# See https://tauri.app/concept/size/#cargo-configuration
[profile.release]
codegen-units = 1
lto = true
opt-level = "s"
panic = "abort"
strip = true
```

- [ ] **Step 4: Create** `crates/core/Cargo.toml`:

```toml
[package]
name = "flashjot-core"
version = "0.3.0"
description = "Flashjot's notes on disk: the store, settings and where they live. No Tauri dependency."
edition.workspace = true
license.workspace = true
repository.workspace = true
publish = false

[dependencies]
serde.workspace = true
serde_json.workspace = true
chrono.workspace = true
dirs.workspace = true

[dev-dependencies]
tempfile.workspace = true
```

and `crates/core/src/lib.rs`:

```rust
//! Flashjot's notes on disk, shared by the app (`src-tauri`) and `flashjot-mcp`.
//! No Tauri dependency, so everything here is unit-tested.

pub mod location;
pub mod settings;
pub mod store;
```

- [ ] **Step 5: Write the failing tests for `location`.** Create `crates/core/src/location.rs` with only the tests and empty stubs:

```rust
//! Where Flashjot keeps its settings and notes. The app and flashjot-mcp both call these,
//! so they always pick the same folder.

use crate::settings::Settings;
use crate::store::Store;
use std::path::PathBuf;

pub const IDENTIFIER: &str = "";

pub fn settings_path() -> Option<PathBuf> {
    None
}

pub fn notes_root(_s: &Settings) -> PathBuf {
    PathBuf::new()
}

pub fn default_root() -> PathBuf {
    PathBuf::new()
}

pub fn open_store(root: PathBuf, _fallback: PathBuf) -> Store {
    Store::new(root)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    /// A path below a regular file can never be created.
    fn unusable(d: &Path) -> PathBuf {
        fs::write(d.join("file"), "").unwrap();
        d.join("file/notes")
    }

    #[test]
    fn identifier_matches_tauri_conf() {
        let conf: serde_json::Value =
            serde_json::from_str(include_str!("../../../src-tauri/tauri.conf.json")).unwrap();
        assert_eq!(conf["identifier"], IDENTIFIER);
    }

    #[test]
    fn settings_path_is_in_the_app_config_folder() {
        let p = settings_path().expect("config dir");
        assert!(p.ends_with(Path::new(IDENTIFIER).join("settings.json")));
    }

    #[test]
    fn notes_root_uses_setting_or_default() {
        let set = Settings { notes_dir: Some(" /tmp/n ".into()), ..Settings::default() };
        assert_eq!(notes_root(&set), PathBuf::from("/tmp/n"));
        let blank = Settings { notes_dir: Some("  ".into()), ..Settings::default() };
        assert_eq!(notes_root(&blank), default_root());
        assert!(default_root().ends_with("Flashjot"));
    }

    #[test]
    fn startup_falls_back_when_saved_notes_dir_is_unusable() {
        let d = tempfile::tempdir().unwrap();
        let fallback = d.path().join("default");
        let store = open_store(unusable(d.path()), fallback.clone());
        assert_eq!(store.root(), fallback);
        assert!(fallback.join("Inbox").is_dir());
    }
}
```

(The last test moves here from `src-tauri/src/commands.rs`.)

- [ ] **Step 6: Run the core tests; the four `location` tests fail**

Run: `cargo test -p flashjot-core location`
Expected: FAIL, 4 failed (`identifier_matches_tauri_conf`, `settings_path_is_in_the_app_config_folder`, `notes_root_uses_setting_or_default`, `startup_falls_back_when_saved_notes_dir_is_unusable`). The moved store and settings tests already pass: `cargo test -p flashjot-core` shows 45 passed, 4 failed.

- [ ] **Step 7: Implement `location`.** Replace everything above `#[cfg(test)]` in `crates/core/src/location.rs` with (the last three functions are moved verbatim from `src-tauri/src/commands.rs`):

```rust
//! Where Flashjot keeps its settings and notes. The app and flashjot-mcp both call these,
//! so they always pick the same folder.

use crate::settings::Settings;
use crate::store::Store;
use std::path::PathBuf;

/// The app's identifier, `identifier` in `src-tauri/tauri.conf.json`.
pub const IDENTIFIER: &str = "io.github.mftnakrsu.flashjot";

/// The settings file: `<config dir>/<IDENTIFIER>/settings.json`, the same folder Tauri's
/// `app_config_dir()` gives the app (`~/.config/…` on Linux, `~/Library/Application Support/…`
/// on macOS, `%APPDATA%\…` on Windows). `None` when the system has no config folder.
pub fn settings_path() -> Option<PathBuf> {
    dirs::config_dir().map(|dir| dir.join(IDENTIFIER).join("settings.json"))
}

/// The notes folder from settings, or `<Documents>/Flashjot` when none is set.
pub fn notes_root(s: &Settings) -> PathBuf {
    match s.notes_dir.as_deref().map(str::trim) {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => default_root(),
    }
}

pub fn default_root() -> PathBuf {
    dirs::document_dir().or_else(dirs::home_dir).unwrap_or_else(|| PathBuf::from(".")).join("Flashjot")
}

/// The saved notes folder, or `fallback` if it can't be used (e.g. a removed drive).
/// The setting is kept, so the folder is used again once it is back.
pub fn open_store(root: PathBuf, fallback: PathBuf) -> Store {
    let store = Store::new(root);
    let Err(e) = store.ensure() else { return store };
    eprintln!("flashjot: notes folder {} unusable ({e}), using {}", store.root().display(), fallback.display());
    let store = Store::new(fallback);
    if let Err(e) = store.ensure() {
        eprintln!("flashjot: notes folder {}: {e}", store.root().display());
    }
    store
}
```

- [ ] **Step 8: Run the core tests**

Run: `cargo test -p flashjot-core`
Expected: PASS, 49 passed.

- [ ] **Step 9: Point the app at the core crate.** In `src-tauri/Cargo.toml`:
  - replace `edition = "2024"` with `edition.workspace = true`;
  - replace the four lines `serde = …`, `serde_json = …`, `chrono = …`, `dirs = …` with:

```toml
flashjot-core = { path = "../crates/core" }
serde.workspace = true
serde_json.workspace = true
chrono.workspace = true
```

  - delete the `# Read the optimization guideline…` comment and the whole `[profile.release]` table (now in the root `Cargo.toml`);
  - replace `tempfile = "3.27.0"` with `tempfile.workspace = true`.

In `src-tauri/src/lib.rs`, the module list becomes:

```rust
mod commands;
mod shortcuts;
mod tray;
mod windows;
```

In `src-tauri/src/shortcuts.rs` line 4: `use flashjot_core::settings::Settings;`

In `src-tauri/src/commands.rs`:
  - the imports at the top become:

```rust
use crate::{shortcuts, windows};
use flashjot_core::location::{default_root, notes_root, open_store};
use flashjot_core::settings::{self, Settings};
use flashjot_core::store::{self, Hit, Note, NoteMeta, Store, TaskGroup, Tree};
use std::io;
use std::path::{Path, PathBuf};
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};
```

  - delete the functions `notes_root`, `default_root` and `open_store` (now in `location`);
  - in `with_store`, change `crate::store::StoreError` to `store::StoreError`;
  - in `mod tests`, delete the test `startup_falls_back_when_saved_notes_dir_is_unusable` (moved in Step 5). Keep the `unusable` helper: `unusable_notes_dir_is_not_saved` still uses it.

Add to `.gitignore` (the workspace's build folder is now at the root):

```
/target
```

- [ ] **Step 10: Run every test in the workspace**

The app's build embeds the frontend, so build it first.

Run: `npm run build && cargo test --workspace`
Expected: PASS: `flashjot-core` 49 passed, `flashjot` 2 passed, no warnings.

- [ ] **Step 11: Commit**

```bash
git add -A Cargo.toml Cargo.lock crates src-tauri .gitignore
git commit -m "refactor: move the note store and settings into a flashjot-core crate

A Cargo workspace with crates/core, so flashjot-mcp can use the same rules as
the app. No behaviour change; the store and settings tests move with the code.

<Co-Authored-By line from your session's attribution reminder>"
```

### Task 2: CI, scripts and docs for the workspace; open PR 1

**Files:**
- Modify: `.github/workflows/ci.yml:24-26,45`, `.github/workflows/release.yml:40-42`, `package.json` (`test` script), `README.md` ("Build from source"), `docs-site/src/content/docs/development/building.md`, `docs-site/src/content/docs/development/architecture.md` ("Rust core"), `CONTRIBUTING.md:20`, `docs-site/src/content/docs/development/contributing.md:20`, `CHANGELOG.md`

**Interfaces:** none.

- [ ] **Step 1: CI.** In `.github/workflows/ci.yml`, the cache step becomes:

```yaml
      - uses: swatinem/rust-cache@v2
        with:
          workspaces: ". -> target"
```

and the last step:

```yaml
      - name: Rust tests
        run: cargo test --workspace
```

In `.github/workflows/release.yml`, the same cache change (`workspaces: ". -> target"`). `tauri-action` finds the root `target/` through `cargo metadata`, so nothing else changes in this phase.

- [ ] **Step 2: npm script.** In `package.json`, `"test": "cargo test --workspace"`.

- [ ] **Step 3: Docs.**
  - `README.md`, "Build from source": `npm run tauri build    # installers in target/release/bundle/`, and `npm test` comment: `# Rust unit tests (cargo test --workspace)`. In the table, `src-tauri/src/store.rs` → `crates/core/src/store.rs`, `src-tauri/src/settings.rs` → `crates/core/src/settings.rs`, and add a row: `| crates/core/src/location.rs | Where the settings file and the notes folder are |`.
  - `docs-site/src/content/docs/development/building.md`: `cd src-tauri && cargo clippy --all-targets` → `cargo clippy --workspace --all-targets`; `src-tauri/target/release/bundle/` → `target/release/bundle/`; the `npm test` comment → `# Rust unit tests: note store, settings and app (cargo test --workspace)`.
  - `docs-site/src/content/docs/development/architecture.md`: before the "Rust core" table add:

```markdown
The Rust code is a Cargo workspace. `crates/core` (`flashjot-core`) holds everything about the
notes on disk and has no Tauri dependency; the app in `src-tauri/` uses it.
```

    and in the table, add `location.rs` (`Where the settings file and the notes folder are, with the fallback when the saved folder is unusable.`); note in the `store.rs` and `settings.rs` rows that they live in `crates/core/src/`.
  - `CONTRIBUTING.md:20` and `docs-site/src/content/docs/development/contributing.md:20`: `src-tauri/src/store.rs` → `crates/core/src/store.rs`.
  - `CHANGELOG.md`, under `## [Unreleased]` in a `### Changed` subsection (Keep a Changelog format, as the file already uses): `- The note store and settings now live in a Tauri-free crate, crates/core (no change for users).`

- [ ] **Step 4: Verify**

Run: `npm test && npm run check && cargo clippy --workspace --all-targets -- -D warnings && (cd docs-site && npm run build)`
Expected: all succeed.

- [ ] **Step 5: Commit, push and open PR 1**

```bash
git add -A .github package.json README.md CHANGELOG.md CONTRIBUTING.md docs-site/src
git commit -m "ci, docs: build and test the Cargo workspace

<Co-Authored-By line>"
git push -u origin refactor/core-crate
gh pr create --title "refactor: flashjot-core crate (workspace)" --body "Step 1 of docs/superpowers/plans/2026-11-23-flashjot-mcp.md. Moves store.rs and settings.rs into crates/core with no behaviour change. All existing tests pass in their new place.

<PR attribution line from your session's attribution reminder>"
```

Wait for CI on all three systems to pass, and for the owner to merge, before Phase 2.

---

# Phase 2: watch the notes folder, #21 (PR 2)

### Task 3: The watcher, without Tauri

**Files:**
- Create: `src-tauri/src/watch.rs`
- Modify: `src-tauri/Cargo.toml` (dependency), `src-tauri/src/lib.rs` (module list)

**Interfaces:**
- Produces:
  - `pub type Watch = notify_debouncer_mini::Debouncer<RecommendedWatcher>;` (stops watching when dropped)
  - `pub fn spawn(root: &Path, on_change: impl Fn() + Send + 'static) -> notify_debouncer_mini::notify::Result<Watch>`
  - `pub fn is_relevant(root: &Path, path: &Path) -> bool`

- [ ] **Step 1: Branch and dependency**

```bash
cd ~/flashjot && git checkout main && git pull --ff-only && git checkout -b feat/watch-notes
```

In `src-tauri/Cargo.toml` under `[dependencies]`: `notify-debouncer-mini = "0.8.0"`. In `src-tauri/src/lib.rs` add `mod watch;` after `mod tray;`.

- [ ] **Step 2: Write the failing tests.** Create `src-tauri/src/watch.rs`:

```rust
//! Watches the notes folder so changes made by other apps (an editor, a sync client,
//! flashjot-mcp) reach the windows as `notes-changed`. No Tauri dependency: `commands.rs`
//! passes in what to do on a change.

use notify_debouncer_mini::notify::RecommendedWatcher;
use notify_debouncer_mini::Debouncer;
use std::path::Path;

/// Stops watching when dropped.
pub type Watch = Debouncer<RecommendedWatcher>;

pub fn spawn(_root: &Path, _on_change: impl Fn() + Send + 'static) -> notify_debouncer_mini::notify::Result<Watch> {
    unimplemented!()
}

pub fn is_relevant(_root: &Path, _path: &Path) -> bool {
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn relevant_paths() {
        let root = Path::new("/n");
        assert!(is_relevant(root, Path::new("/n/Inbox/2026-11-23-101500.md")));
        assert!(is_relevant(root, Path::new("/n/Projects")));
        assert!(is_relevant(root, Path::new("/n/Projects/Idea.md")));
        assert!(!is_relevant(root, Path::new("/n/Projects/Idea.md.tmp")));
        assert!(!is_relevant(root, Path::new("/n/.trash/20261123 Idea.md")));
        assert!(!is_relevant(root, Path::new("/n/.obsidian/workspace.json")));
        assert!(!is_relevant(root, Path::new("/n/picture.png")));
        assert!(!is_relevant(root, Path::new("/n")));
        assert!(!is_relevant(root, Path::new("/elsewhere/Idea.md")));
    }

    #[test]
    fn reports_a_page_written_by_another_app() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move || {
            let _ = tx.send(());
        })
        .unwrap();
        std::fs::write(root.join("Idea.md"), "hello\n").unwrap();
        rx.recv_timeout(Duration::from_secs(5)).expect("notes-changed after a write");
    }

    #[test]
    fn ignores_the_trash() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        std::fs::create_dir(root.join(".trash")).unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move || {
            let _ = tx.send(());
        })
        .unwrap();
        std::fs::write(root.join(".trash/old.md"), "x\n").unwrap();
        assert!(rx.recv_timeout(Duration::from_millis(1500)).is_err());
    }
}
```

- [ ] **Step 3: Run them; they fail**

Run: `cargo test -p flashjot watch`
Expected: FAIL: `relevant_paths` (assertion), the other two panic at `unimplemented!()`.

- [ ] **Step 4: Implement.** Replace everything above `#[cfg(test)]` with:

```rust
//! Watches the notes folder so changes made by other apps (an editor, a sync client,
//! flashjot-mcp) reach the windows as `notes-changed`. No Tauri dependency: `commands.rs`
//! passes in what to do on a change.

use notify_debouncer_mini::notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{DebounceEventResult, DebouncedEventBatch, Debouncer, new_debouncer};
use std::path::{Component, Path};
use std::time::Duration;

/// Changes closer together than this arrive as one batch, e.g. a sync client writing many files.
const DEBOUNCE: Duration = Duration::from_millis(300);

/// Stops watching when dropped.
pub type Watch = Debouncer<RecommendedWatcher>;

/// Starts watching `root` and everything below it; calls `on_change` at most once per batch,
/// and only when the batch touches something the notebook shows (see `is_relevant`).
/// `root` must be canonical: some systems (macOS) report canonical paths.
pub fn spawn(root: &Path, on_change: impl Fn() + Send + 'static) -> notify_debouncer_mini::notify::Result<Watch> {
    let base = root.to_path_buf();
    let mut debouncer = new_debouncer(DEBOUNCE, move |res: DebounceEventResult| match res {
        Ok(DebouncedEventBatch::Events(events)) => {
            if events.iter().any(|e| is_relevant(&base, &e.path)) {
                on_change();
            }
        }
        // Events were lost (e.g. a full queue): reload everything to be safe.
        Ok(DebouncedEventBatch::Rescan) => on_change(),
        Ok(_) => {}
        Err(e) => eprintln!("flashjot: watching notes folder: {e:?}"),
    })?;
    debouncer.watcher().watch(root, RecursiveMode::Recursive)?;
    Ok(debouncer)
}

/// A Markdown page or a folder, not inside a hidden folder (`.trash`, `.git`, `.obsidian`)
/// and not an `atomic_write` temp file (its final rename reports the `.md` path anyway).
pub fn is_relevant(root: &Path, path: &Path) -> bool {
    let Ok(rel) = path.strip_prefix(root) else { return false };
    let hidden = rel.components().any(|c| matches!(c, Component::Normal(n) if n.to_string_lossy().starts_with('.')));
    if hidden || rel.as_os_str().is_empty() {
        return false;
    }
    match path.extension() {
        Some(ext) => ext == "md",
        // No extension: a folder (created, renamed or removed).
        None => true,
    }
}
```

- [ ] **Step 5: Run them; they pass**

Run: `cargo test -p flashjot watch`
Expected: PASS, 3 passed (the trash test takes about 1.5 s).

- [ ] **Step 6: Commit**

```bash
git add src-tauri/Cargo.toml Cargo.lock src-tauri/src/watch.rs src-tauri/src/lib.rs
git commit -m "feat(watch): a debounced watcher for the notes folder (#21)

<Co-Authored-By line>"
```

### Task 4: Start the watcher with the app and when the notes folder changes

**Files:**
- Modify: `src-tauri/src/commands.rs` (`AppState`, new `watch_notes`, `set_settings`), `src-tauri/src/lib.rs` (`setup`)

**Interfaces:**
- Consumes: `watch::spawn`, `watch::Watch` (Task 3); `changed(&AppHandle)` (existing, `commands.rs`).
- Produces: `pub fn watch_notes(app: &AppHandle)` in `commands.rs`; `AppState.watch: Mutex<Option<watch::Watch>>`.

This task is wiring. Its test is the build plus the manual check in Task 5 (a Tauri `AppHandle` cannot be built in a unit test here).

- [ ] **Step 1: State.** In `commands.rs`, add `use crate::watch;` to the imports, and a field to `AppState`:

```rust
pub struct AppState {
    pub store: Mutex<Store>,
    pub settings: Mutex<Settings>,
    pub settings_path: PathBuf,
    /// Watches the notes folder; replaced when the folder changes, dropped to stop.
    pub watch: Mutex<Option<watch::Watch>>,
}
```

and in `AppState::new`: `AppState { store: Mutex::new(store), settings: Mutex::new(settings), settings_path, watch: Mutex::new(None) }`.

- [ ] **Step 2: `watch_notes`.** In `commands.rs`, below `fn changed`:

```rust
/// (Re)starts watching the notes folder, so changes other apps make (an editor, a sync
/// client, flashjot-mcp) reach the windows as `notes-changed`.
pub fn watch_notes(app: &AppHandle) {
    let state = app.state::<AppState>();
    let Ok(root) = state.store.lock().map(|s| s.root().to_path_buf()) else { return };
    // Some systems report canonical paths (macOS: /private/var/… for /var/…).
    let root = root.canonicalize().unwrap_or(root);
    let handle = app.clone();
    let watch = match watch::spawn(&root, move || changed(&handle)) {
        Ok(w) => Some(w),
        Err(e) => {
            eprintln!("flashjot: not watching {}: {e:?}", root.display());
            None
        }
    };
    if let Ok(mut slot) = state.watch.lock() {
        *slot = watch;
    }
}
```

- [ ] **Step 3: Call sites.** In `set_settings`, change the end to:

```rust
    let _ = app.emit("settings-changed", ());
    if new_root {
        watch_notes(&app);
        changed(&app);
    }
    Ok(problems)
```

In `lib.rs` `setup`, right after `purge_old_trash(&handle);`:

```rust
            commands::watch_notes(&handle);
```

- [ ] **Step 4: Build and test**

Run: `cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings`
Expected: PASS, no warnings. (`Mutex<Option<watch::Watch>>` in managed state needs `Watch: Send`; that compiled on Linux. If macOS or Windows CI says otherwise, that is the line to look at.)

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/commands.rs src-tauri/src/lib.rs
git commit -m "feat(watch): refresh the windows when notes change outside Flashjot (#21)

<Co-Authored-By line>"
```

### Task 5: Reload the open page when it changed on disk; open PR 2

**Files:**
- Modify: `src/lib/notebook.svelte.ts:38-54`, `src/lib/editor/Editor.svelte`, `docs/manual-test.md`, `docs-site/src/content/docs/guide/your-notes.md` and `tr/guide/your-notes.md`, `README.md` (Roadmap), `CHANGELOG.md`

**Interfaces:**
- Produces: `nb.reloadOpen: () => Promise<void>` (set by the editor, like `nb.flush`).

- [ ] **Step 1: The hook in `notebook.svelte.ts`.** Below `flush: … = async () => {};` add:

```ts
  /** Set by the editor; shows the open page again if it changed on disk and has no unsaved text. */
  reloadOpen: () => Promise<void> = async () => {};
```

and make `refresh()` call it first:

```ts
  /** Runs on every notes-changed event: each command that changes notes emits it, and so does
   *  the notes-folder watcher when another app changes a file. */
  async refresh() {
    try {
      await this.reloadOpen();
      const [tree, inbox, tasks] = await Promise.all([api.getTree(), api.listInbox(), api.openTasks()]);
```

(the rest of `refresh` unchanged).

- [ ] **Step 2: The editor side.** In `Editor.svelte`, below `async function load(next: string) {…}` add:

```ts
  /** After a notes-changed event: if the page on disk is newer than what is shown and nothing is
   *  waiting to be saved, show the disk version. Our own saves never trigger this, because each
   *  save updates `modified` to the time on disk. */
  async function reloadIfChanged() {
    if (!loadedPath || pending !== null || status !== "saved") return;
    const target = loadedPath;
    let note: Note;
    try {
      note = await readNote(target);
    } catch {
      return; // moved or deleted elsewhere: the sidebar refresh shows that
    }
    if (target !== loadedPath || pending !== null || note.modified === modified) return;
    modified = note.modified;
    view?.setState(createEditorState(note.content, { placeholder: t("nb.editorPlaceholder"), onChange }));
  }
```

In `onMount`, after `nb.flush = flush;`: `nb.reloadOpen = reloadIfChanged;`. In `onDestroy`, after the `nb.flush` line: `if (nb.reloadOpen === reloadIfChanged) nb.reloadOpen = async () => {};`.

- [ ] **Step 3: Type check**

Run: `npm run check`
Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Manual checks.** Add to `docs/manual-test.md`, under "## Notebook":

```markdown
- [ ] With the notebook open, create `Idea.md` in the notes folder from a terminal or another editor: it appears in the sidebar within a second (#21).
- [ ] Add a file to `Inbox/` from outside: the Inbox shows it and the count goes up.
- [ ] Open a page in Flashjot, change and save it in another editor: Flashjot shows the new text within a second; typing in Flashjot meanwhile is not lost (the conflict message shows instead).
- [ ] Typing in a page never makes it jump or reload by itself.
```

Then run `npm run tauri dev` with a scratch notes folder and go through these four lines and the existing "Notebook" section.

- [ ] **Step 5: Docs.**
  - `docs-site/src/content/docs/guide/your-notes.md`, after the bullet list in "Where they are": `Flashjot notices when another program changes these files: the sidebar, the Inbox and an open page update within a second.` In `tr/guide/your-notes.md`, the same place: `Flashjot bu dosyalar başka bir programla değiştirildiğinde bunu fark eder: kenar çubuğu, Gelen Kutusu ve açık sayfa bir saniye içinde güncellenir.`
  - `README.md` Roadmap: tick the #21 line (`- [x]`).
  - `CHANGELOG.md` under `## [Unreleased]`, `### Added`: `- The notebook updates when notes change outside Flashjot: the sidebar, the Inbox and the open page (#21).`

- [ ] **Step 6: Commit, push, PR 2**

```bash
git add src/lib docs/manual-test.md docs-site/src README.md CHANGELOG.md
git commit -m "feat(notebook): reload the open page when it changed on disk (#21)

<Co-Authored-By line>"
git push -u origin feat/watch-notes
gh pr create --title "feat: watch the notes folder (#21)" --body "Step 2 of docs/superpowers/plans/2026-11-23-flashjot-mcp.md. Closes #21.

<PR attribution line>"
```

---

# Phase 3: the MCP server (PR 3)

### Task 6: `settings::peek`, a loader that never writes

**Files:**
- Modify: `crates/core/src/settings.rs`

**Interfaces:**
- Produces: `pub fn peek(path: &Path) -> Settings` in `flashjot_core::settings`.

- [ ] **Step 1: Branch**

```bash
cd ~/flashjot && git checkout main && git pull --ff-only && git checkout -b feat/mcp-server
```

- [ ] **Step 2: Failing test.** In `settings.rs` `mod tests`, add:

```rust
    #[test]
    fn peek_reads_settings_and_never_moves_a_corrupt_file() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("settings.json");
        assert_eq!(peek(&p), Settings::default());
        fs::write(&p, r#"{"language":"tr","tasksPage":"Görevler.md"}"#).unwrap();
        let s = peek(&p);
        assert_eq!(s.language, "tr");
        assert_eq!(s.tasks_page.as_deref(), Some("Görevler.md"));
        fs::write(&p, "{ not json").unwrap();
        assert_eq!(peek(&p), Settings::default());
        assert_eq!(fs::read_to_string(&p).unwrap(), "{ not json");
        assert!(!d.path().join("settings.json.bak").exists());
    }
```

Run: `cargo test -p flashjot-core peek`
Expected: FAIL to compile, "cannot find function `peek`".

- [ ] **Step 3: Implement.** Above `pub fn save`:

```rust
/// Like `load`, but never touches the file: a missing or corrupt one gives defaults and a
/// corrupt one stays as it is. For flashjot-mcp, which must never write the app's settings.
pub fn peek(path: &Path) -> Settings {
    std::fs::read_to_string(path).ok().and_then(|text| serde_json::from_str(&text).ok()).unwrap_or_default()
}
```

Run: `cargo test -p flashjot-core peek`
Expected: PASS, 1 passed.

- [ ] **Step 4: Commit**

```bash
git add crates/core/src/settings.rs
git commit -m "feat(core): settings::peek reads settings without ever writing them

<Co-Authored-By line>"
```

### Task 7: `crates/mcp` and the tool logic (`notebook.rs`)

**Files:**
- Create: `crates/mcp/Cargo.toml`, `crates/mcp/src/main.rs` (temporary stub), `crates/mcp/src/notebook.rs`
- Modify: `Cargo.toml` (workspace members)

**Interfaces:**
- Consumes: `flashjot_core::{location, settings::{self, Settings}, store::{self, …}}`; `settings::peek` (Task 6).
- Produces (in `crates/mcp/src/notebook.rs`):
  - `pub struct Notebook` with `pub fn open(notes_dir: Option<PathBuf>, settings_path: Option<PathBuf>) -> io::Result<Notebook>` and `pub fn root(&self) -> &Path`
  - `pub struct ToolError(pub String)`
  - `pub enum Captured { Note { path }, Tasks { path, count }, Error { message } }` (serialized with `"kind"`)
  - `pub struct Trashed { pub trash_path: String, pub original_path: String }` (serialized camelCase)
  - methods: `capture(&self, &[String], NaiveDateTime) -> Vec<Captured>`, `list_inbox() -> Result<Vec<NoteMeta>, ToolError>`, `overview() -> Result<String, ToolError>`, `read(&str) -> Result<Note, ToolError>`, `search(&str, usize) -> Result<Vec<Hit>, ToolError>`, `open_tasks() -> Result<Vec<TaskGroup>, ToolError>`, `set_task(&str, usize, &str, bool) -> Result<(), ToolError>`, `write(&str, &str, i64) -> Result<i64, ToolError>`, `create_folder(&str) -> Result<(), ToolError>`, `create_page(&str, &str) -> Result<NoteMeta, ToolError>`, `rename(&str, &str) -> Result<NoteMeta, ToolError>`, `move_to(&str, &str) -> Result<NoteMeta, ToolError>`, `trash(&str) -> Result<Trashed, ToolError>`, `restore(&str, &str) -> Result<(), ToolError>`
  - `pub fn tasks_title(language: &str, locale: Option<String>) -> &'static str`; `pub const SEARCH_MAX: usize = 50;`

- [ ] **Step 1: The package.** Root `Cargo.toml`: `members = ["src-tauri", "crates/core", "crates/mcp"]`. Create `crates/mcp/Cargo.toml`:

```toml
[package]
name = "flashjot-mcp"
version = "0.3.0"
description = "MCP server for Flashjot: lets AI agents capture, read, search and organise your notes."
edition.workspace = true
license.workspace = true
repository.workspace = true
publish = false

[dependencies]
flashjot-core = { path = "../core" }
rmcp = { version = "3.11.0", features = ["server", "macros", "transport-io"] }
tokio = { version = "1", features = ["macros", "rt", "io-std"] }
serde.workspace = true
serde_json.workspace = true
chrono.workspace = true
sys-locale = "0.3.2"

[dev-dependencies]
tempfile.workspace = true
```

and a temporary `crates/mcp/src/main.rs` (replaced in Task 8):

```rust
mod notebook;

fn main() {}
```

- [ ] **Step 2: Write the tests first.** Create `crates/mcp/src/notebook.rs` with the types and signatures above, every method body `unimplemented!()` (and `tasks_title` returning `"Tasks"`), followed by this test module:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    fn now() -> NaiveDateTime {
        NaiveDateTime::parse_from_str("2026-11-23 10:15:00", "%Y-%m-%d %H:%M:%S").unwrap()
    }

    /// A notebook in a temp folder, with a settings file holding `settings_json` (if any).
    fn notebook(settings_json: Option<&str>) -> (tempfile::TempDir, Notebook) {
        let d = tempfile::tempdir().unwrap();
        let settings_path = d.path().join("settings.json");
        if let Some(json) = settings_json {
            fs::write(&settings_path, json).unwrap();
        }
        let nb = Notebook::open(Some(d.path().join("notes")), Some(settings_path)).unwrap();
        (d, nb)
    }

    fn file(nb: &Notebook, rel: &str) -> String {
        fs::read_to_string(nb.root().join(rel)).unwrap()
    }

    #[test]
    fn capture_saves_notes_and_tasks_and_reports_each() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        let out = nb.capture(&["first idea".into(), "[] milk\nbread".into(), "   ".into(), "second idea".into()], now());
        assert_eq!(out[0], Captured::Note { path: "Inbox/2026-11-23-101500.md".into() });
        assert_eq!(out[1], Captured::Tasks { path: "Tasks.md".into(), count: 2 });
        assert_eq!(out[2], Captured::Error { message: "The note is empty.".into() });
        assert_eq!(out[3], Captured::Note { path: "Inbox/2026-11-23-101500-2.md".into() });
        assert_eq!(file(&nb, "Tasks.md"), "- [ ] milk\n- [ ] bread\n");
        assert_eq!(file(&nb, "Inbox/2026-11-23-101500.md"), "first idea\n");
    }

    #[test]
    fn capture_of_only_brackets_is_an_error() {
        let (_d, nb) = notebook(None);
        assert!(matches!(&nb.capture(&["[]".into()], now())[0], Captured::Error { .. }));
    }

    #[test]
    fn tasks_go_to_the_page_named_in_settings() {
        let (_d, nb) = notebook(Some(r#"{"language":"en","tasksPage":"Lists/Todo.md"}"#));
        fs::create_dir_all(nb.root().join("Lists")).unwrap();
        fs::write(nb.root().join("Lists/Todo.md"), "# Todo\n").unwrap();
        nb.capture(&["[] call Ana".into()], now());
        assert_eq!(file(&nb, "Lists/Todo.md"), "# Todo\n- [ ] call Ana\n");
        assert!(!nb.root().join("Tasks.md").exists());
    }

    #[test]
    fn tasks_go_to_the_only_existing_default_page_whatever_the_language() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        fs::write(nb.root().join("Görevler.md"), "").unwrap();
        nb.capture(&["[] süt".into()], now());
        assert_eq!(file(&nb, "Görevler.md"), "- [ ] süt\n");
        assert!(!nb.root().join("Tasks.md").exists());
    }

    #[test]
    fn tasks_page_title_follows_the_language() {
        let (_d, nb) = notebook(Some(r#"{"language":"tr"}"#));
        nb.capture(&["[] süt".into()], now());
        assert_eq!(file(&nb, "Görevler.md"), "- [ ] süt\n");
    }

    #[test]
    fn tasks_title_for_each_language() {
        assert_eq!(tasks_title("en", Some("tr-TR".into())), "Tasks");
        assert_eq!(tasks_title("tr", None), "Görevler");
        assert_eq!(tasks_title("auto", Some("tr-TR".into())), "Görevler");
        assert_eq!(tasks_title("auto", Some("en-US".into())), "Tasks");
        assert_eq!(tasks_title("auto", None), "Tasks");
    }

    #[test]
    fn the_server_never_writes_settings() {
        let (d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["[] milk".into()], now());
        assert_eq!(fs::read_to_string(d.path().join("settings.json")).unwrap(), r#"{"language":"en"}"#);
    }

    #[test]
    fn write_needs_the_time_from_read() {
        let (_d, nb) = notebook(None);
        let page = nb.create_page("", "Plan").unwrap();
        let note = nb.read(&page.path).unwrap();
        // Someone else saves the page after the agent read it.
        std::thread::sleep(std::time::Duration::from_millis(20));
        fs::write(nb.root().join("Plan.md"), "edited in another app\n").unwrap();
        let err = nb.write(&page.path, "agent text\n", note.modified).unwrap_err();
        assert!(err.0.contains("changed since it was read"));
        assert_eq!(file(&nb, "Plan.md"), "edited in another app\n");
        let fresh = nb.read(&page.path).unwrap();
        nb.write(&page.path, "agent text\n", fresh.modified).unwrap();
        assert_eq!(file(&nb, "Plan.md"), "agent text\n");
    }

    #[test]
    fn write_never_creates_a_note() {
        let (_d, nb) = notebook(None);
        let err = nb.write("Typo.md", "x", 0).unwrap_err();
        assert!(err.0.starts_with("No note at \"Typo.md\""));
        assert!(!nb.root().join("Typo.md").exists());
    }

    #[test]
    fn set_task_refuses_a_line_that_changed() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["[] milk\nbread".into()], now());
        let groups = nb.open_tasks().unwrap();
        assert_eq!(groups[0].path, "Tasks.md");
        let bread = &groups[0].tasks[1];
        assert!(nb.set_task("Tasks.md", bread.line, "milk", true).is_err());
        nb.set_task("Tasks.md", bread.line, &bread.text, true).unwrap();
        assert_eq!(file(&nb, "Tasks.md"), "- [ ] milk\n- [x] bread\n");
    }

    #[test]
    fn trash_then_restore() {
        let (_d, nb) = notebook(None);
        let page = nb.create_page("Projects", "Idea").unwrap();
        let t = nb.trash(&page.path).unwrap();
        assert_eq!(t.original_path, "Projects/Idea.md");
        assert!(t.trash_path.starts_with(".trash/"));
        assert!(!nb.root().join("Projects/Idea.md").exists());
        nb.restore(&t.trash_path, &t.original_path).unwrap();
        assert!(nb.root().join("Projects/Idea.md").exists());
    }

    #[test]
    fn paths_outside_the_notes_folder_are_refused() {
        let (_d, nb) = notebook(None);
        for bad in ["../settings.json", "/etc/passwd", ".trash/x.md", "a\\b.md"] {
            assert!(nb.read(bad).is_err(), "{bad}");
        }
        assert!(nb.create_folder("../outside").is_err());
        assert!(!nb.root().parent().unwrap().join("outside").exists());
    }

    #[test]
    fn search_keeps_the_first_limit_hits() {
        let (_d, nb) = notebook(None);
        for i in 0..5 {
            fs::write(nb.root().join(format!("Note {i}.md")), "apple\n").unwrap();
        }
        assert_eq!(nb.search("apple", 3).unwrap().len(), 3);
        assert_eq!(nb.search("apple", 0).unwrap().len(), 1);
    }

    #[test]
    fn overview_lists_inbox_pages_and_folders() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["idea".into(), "[] milk".into()], now());
        nb.create_page("Projects", "Flashjot ideas").unwrap();
        nb.create_folder("Empty").unwrap();
        let md = nb.overview().unwrap();
        assert!(md.contains("- Inbox: 1 notes"), "{md}");
        assert!(md.contains("- Tasks.md\n"), "{md}");
        assert!(md.contains("## Projects\n\n- Projects/Flashjot ideas.md\n"), "{md}");
        assert!(md.contains("## Empty\n\n(no pages)\n"), "{md}");
    }

    #[test]
    fn notes_dir_is_created() {
        let d = tempfile::tempdir().unwrap();
        let nb = Notebook::open(Some(d.path().join("new/notes")), None).unwrap();
        assert!(nb.root().join("Inbox").is_dir());
        assert!(Path::new(&nb.root()).ends_with("new/notes"));
    }
}
```

- [ ] **Step 3: Run them; they fail**

Run: `cargo test -p flashjot-mcp`
Expected: FAIL; most tests panic at `unimplemented!()`, `tasks_title_for_each_language` fails its assertion.

- [ ] **Step 4: Implement.** Replace everything above `#[cfg(test)]` in `notebook.rs` with:

```rust
//! What each tool does, on top of `flashjot_core`. No MCP types here, so every rule is
//! unit-tested directly; `server.rs` only turns these results into MCP replies.

use chrono::NaiveDateTime;
use flashjot_core::location::{self, default_root, notes_root, open_store};
use flashjot_core::settings::{self, Settings};
use flashjot_core::store::{self, Hit, Note, NoteMeta, Store, StoreError, TaskGroup};
use serde::Serialize;
use std::fmt::Write as _;
use std::io;
use std::path::PathBuf;

/// The store already caps search at this many hits.
pub const SEARCH_MAX: usize = 50;

/// The Tasks page titles the app uses (`tasks.pageTitle` in src/lib/i18n.svelte.ts).
const TASKS_TITLES: [&str; 2] = ["Tasks", "Görevler"];

pub struct Notebook {
    store: Store,
    /// Read on every call (the app may change it meanwhile), never written.
    settings_path: Option<PathBuf>,
}

/// A message for the agent, shown as a tool error.
#[derive(Debug, PartialEq)]
pub struct ToolError(pub String);

/// One note given to `capture`.
#[derive(Debug, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Captured {
    Note { path: String },
    Tasks { path: String, count: usize },
    Error { message: String },
}

/// Both paths `restore-note` needs.
#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trashed {
    pub trash_path: String,
    pub original_path: String,
}

impl Notebook {
    /// `notes_dir` (`--notes-dir`) wins and then settings are only read from `settings_path`
    /// (`--settings`); otherwise the app's settings file and notes folder are used, with the
    /// same fallback as the app when the saved folder is unusable.
    pub fn open(notes_dir: Option<PathBuf>, settings_path: Option<PathBuf>) -> io::Result<Notebook> {
        match notes_dir {
            Some(dir) => {
                let store = Store::new(dir);
                store.ensure()?;
                Ok(Notebook { store, settings_path })
            }
            None => {
                let settings_path = settings_path.or_else(location::settings_path);
                let s = settings_path.as_deref().map(settings::peek).unwrap_or_default();
                Ok(Notebook { store: open_store(notes_root(&s), default_root()), settings_path })
            }
        }
    }

    pub fn root(&self) -> &std::path::Path {
        self.store.root()
    }

    fn settings(&self) -> Settings {
        self.settings_path.as_deref().map(settings::peek).unwrap_or_default()
    }

    /// Saves each note on its own, like the quick box: text starting with "[]" adds tasks to
    /// the Tasks page, anything else becomes an Inbox note. One failure doesn't stop the rest.
    pub fn capture(&self, notes: &[String], now: NaiveDateTime) -> Vec<Captured> {
        notes
            .iter()
            .map(|text| self.capture_one(text, now).unwrap_or_else(|ToolError(message)| Captured::Error { message }))
            .collect()
    }

    fn capture_one(&self, text: &str, now: NaiveDateTime) -> Result<Captured, ToolError> {
        match store::parse_tasks(text) {
            None => {
                let meta = self.store.add_inbox(text, now).map_err(|e| message(e, ""))?;
                Ok(Captured::Note { path: meta.path })
            }
            Some(tasks) if tasks.is_empty() => Err(ToolError("Only \"[]\": write the tasks after it.".into())),
            Some(tasks) => {
                let s = self.settings();
                let title = self.tasks_title(&s);
                let path = self.store.add_tasks(s.tasks_page.as_deref(), &title, &tasks).map_err(|e| message(e, &title))?;
                Ok(Captured::Tasks { path, count: tasks.len() })
            }
        }
    }

    /// The title `add_tasks` uses when settings name no Tasks page (or it is gone): the only
    /// existing `Tasks.md`/`Görevler.md` at the root, else the app's title for its language.
    fn tasks_title(&self, s: &Settings) -> String {
        let existing: Vec<&str> =
            TASKS_TITLES.into_iter().filter(|t| self.store.root().join(format!("{t}.md")).is_file()).collect();
        match existing.as_slice() {
            [only] => only.to_string(),
            _ => tasks_title(&s.language, sys_locale::get_locale()).to_string(),
        }
    }

    pub fn list_inbox(&self) -> Result<Vec<NoteMeta>, ToolError> {
        self.store.list_inbox().map_err(|e| message(e, ""))
    }

    /// Markdown: the Inbox count, root pages, then each folder with its pages.
    pub fn overview(&self) -> Result<String, ToolError> {
        let tree = self.store.tree().map_err(|e| message(e, ""))?;
        let inbox = self.list_inbox()?.len();
        let mut out = format!("# Notebook ({})\n\n- Inbox: {inbox} notes (list-inbox shows them)\n", self.root().display());
        for page in &tree.root_pages {
            let _ = writeln!(out, "- {}", page.path);
        }
        for folder in &tree.folders {
            let _ = writeln!(out, "\n## {}\n", folder.name);
            if folder.pages.is_empty() {
                out.push_str("(no pages)\n");
            }
            for page in &folder.pages {
                let _ = writeln!(out, "- {}", page.path);
            }
        }
        Ok(out)
    }

    pub fn read(&self, path: &str) -> Result<Note, ToolError> {
        self.store.read(path).map_err(|e| message(e, path))
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<Hit>, ToolError> {
        let mut hits = self.store.search(query).map_err(|e| message(e, ""))?;
        hits.truncate(limit.clamp(1, SEARCH_MAX));
        Ok(hits)
    }

    pub fn open_tasks(&self) -> Result<Vec<TaskGroup>, ToolError> {
        let first = self.settings().tasks_page;
        self.store.open_tasks(first.as_deref()).map_err(|e| message(e, ""))
    }

    pub fn set_task(&self, path: &str, line: usize, text: &str, done: bool) -> Result<(), ToolError> {
        self.store.set_task(path, line, text, done).map_err(|e| message(e, path))
    }

    /// Replaces an existing note, only if it is unchanged since `modified` (from `read`).
    /// New notes come from `create_page`, so a mistyped path never creates a file.
    pub fn write(&self, path: &str, content: &str, modified: i64) -> Result<i64, ToolError> {
        self.read(path)?;
        self.store.write(path, content, Some(modified)).map_err(|e| message(e, path))
    }

    pub fn create_folder(&self, name: &str) -> Result<(), ToolError> {
        self.store.create_folder(name).map_err(|e| message(e, name))
    }

    pub fn create_page(&self, folder: &str, title: &str) -> Result<NoteMeta, ToolError> {
        self.store.create_page(folder, title).map_err(|e| message(e, title))
    }

    pub fn rename(&self, path: &str, title: &str) -> Result<NoteMeta, ToolError> {
        self.store.rename(path, title).map_err(|e| message(e, path))
    }

    pub fn move_to(&self, path: &str, folder: &str) -> Result<NoteMeta, ToolError> {
        self.store.move_to(path, folder).map_err(|e| message(e, path))
    }

    pub fn trash(&self, path: &str) -> Result<Trashed, ToolError> {
        let trash_path = self.store.trash(path).map_err(|e| message(e, path))?;
        Ok(Trashed { trash_path, original_path: path.to_string() })
    }

    pub fn restore(&self, trash_path: &str, original_path: &str) -> Result<(), ToolError> {
        self.store.restore(trash_path, original_path).map_err(|e| message(e, trash_path))
    }
}

/// The app's `tasks.pageTitle` for the `language` setting; "auto" follows the system locale
/// the way the UI's `detect()` follows `navigator.language`.
pub fn tasks_title(language: &str, locale: Option<String>) -> &'static str {
    let turkish = match language {
        "tr" => true,
        "en" => false,
        _ => locale.is_some_and(|l| l.to_lowercase().starts_with("tr")),
    };
    if turkish { "Görevler" } else { "Tasks" }
}

/// Store errors as messages an agent can act on (spec §5).
fn message(e: StoreError, subject: &str) -> ToolError {
    ToolError(match e {
        StoreError::Empty => "The note is empty.".into(),
        StoreError::InvalidPath | StoreError::NotFound => {
            format!("No note at \"{subject}\". Use search or list-notebook to find it.")
        }
        StoreError::InvalidName => format!(
            "\"{subject}\" can't be used as a name: it is empty, starts with a dot, is longer than 200 bytes or contains / \\ : * ? \" < > |."
        ),
        StoreError::ReservedName => {
            format!("\"{subject}\" can't be used as a name: Windows reserves it (CON, NUL, COM1… or a name ending in a dot).")
        }
        StoreError::Conflict => "The note changed since it was read. Read it again with read-note and redo the change.".into(),
        StoreError::Io(e) => e.to_string(),
    })
}
```

- [ ] **Step 5: Run them; they pass**

Run: `cargo test -p flashjot-mcp`
Expected: PASS, 15 passed (dead-code warnings for methods `main.rs` does not call yet are expected until Task 8).

- [ ] **Step 6: Commit**

```bash
git add Cargo.toml Cargo.lock crates/mcp
git commit -m "feat(mcp): the notebook operations behind the MCP tools

<Co-Authored-By line>"
```

### Task 8: The MCP server, its instructions and the stdio test

**Files:**
- Create: `crates/mcp/src/server.rs`, `crates/mcp/src/instructions.md`, `crates/mcp/tests/stdio.rs`
- Replace: `crates/mcp/src/main.rs`

**Interfaces:**
- Consumes: everything `notebook.rs` produces (Task 7).
- Produces: the `flashjot-mcp` binary: `flashjot-mcp [--notes-dir <folder>] [--settings <file>] [--help] [--version]`, serving MCP over stdio with the 14 tools.

- [ ] **Step 1: The end-to-end test first.** Create `crates/mcp/tests/stdio.rs`:

```rust
//! Starts the built flashjot-mcp and talks to it the way an MCP client does: JSON-RPC
//! messages, one per line, over stdin and stdout.

use serde_json::{Value, json};
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};

struct Client {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
    next_id: u64,
}

impl Client {
    fn start(notes: &std::path::Path) -> Client {
        let mut child = Command::new(env!("CARGO_BIN_EXE_flashjot-mcp"))
            .arg("--notes-dir")
            .arg(notes)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let stdin = child.stdin.take().unwrap();
        let stdout = BufReader::new(child.stdout.take().unwrap());
        Client { child, stdin, stdout, next_id: 1 }
    }

    fn send(&mut self, msg: Value) {
        writeln!(self.stdin, "{msg}").unwrap();
        self.stdin.flush().unwrap();
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        let id = self.next_id;
        self.next_id += 1;
        self.send(json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params }));
        loop {
            let mut line = String::new();
            assert!(self.stdout.read_line(&mut line).unwrap() > 0, "server closed stdout");
            let msg: Value = serde_json::from_str(&line).unwrap();
            if msg["id"] == id {
                return msg;
            }
        }
    }

    fn call(&mut self, tool: &str, arguments: Value) -> Value {
        self.request("tools/call", json!({ "name": tool, "arguments": arguments }))["result"].clone()
    }
}

impl Drop for Client {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

fn text(result: &Value) -> &str {
    result["content"][0]["text"].as_str().unwrap()
}

#[test]
fn an_mcp_client_can_capture_and_read_notes() {
    let d = tempfile::tempdir().unwrap();
    let notes = d.path().join("notes");
    let mut c = Client::start(&notes);

    let init = c.request(
        "initialize",
        json!({ "protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": { "name": "test", "version": "0" } }),
    );
    assert_eq!(init["result"]["serverInfo"]["name"], "flashjot-mcp");
    assert!(init["result"]["instructions"].as_str().unwrap().contains("read-note first"));
    c.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));

    let tools = c.request("tools/list", json!({}));
    let mut names: Vec<&str> = tools["result"]["tools"].as_array().unwrap().iter().map(|t| t["name"].as_str().unwrap()).collect();
    names.sort();
    assert_eq!(
        names,
        [
            "capture", "create-folder", "create-page", "list-inbox", "list-notebook", "move-note", "open-tasks",
            "read-note", "rename-note", "restore-note", "search", "set-task", "trash-note", "write-note"
        ]
    );

    let captured = c.call("capture", json!({ "notes": ["buy a new lamp"] }));
    assert_eq!(captured["isError"], false);
    let saved: Value = serde_json::from_str(text(&captured)).unwrap();
    let path = saved[0]["path"].as_str().unwrap().to_string();
    assert!(path.starts_with("Inbox/"));
    assert_eq!(std::fs::read_to_string(notes.join(&path)).unwrap(), "buy a new lamp\n");

    let read = c.call("read-note", json!({ "path": path }));
    let note: Value = serde_json::from_str(text(&read)).unwrap();
    assert_eq!(note["content"], "buy a new lamp\n");

    let stale = c.call("write-note", json!({ "path": path, "content": "x", "modified": 1 }));
    assert_eq!(stale["isError"], true);
    assert!(text(&stale).contains("changed since it was read"));

    let missing = c.call("read-note", json!({ "path": "../outside.md" }));
    assert_eq!(missing["isError"], true);
}
```

Run: `cargo test -p flashjot-mcp --test stdio`
Expected: FAIL: the stub `main` exits at once, so the test panics on a broken pipe or with "server closed stdout".

- [ ] **Step 2: The instructions.** Create `crates/mcp/src/instructions.md`:

```markdown
Flashjot is the user's notebook: plain Markdown files in one folder. Quick notes land in the Inbox; pages live at the root or in folders; tasks are "- [ ] " lines, and one Tasks page collects quick tasks.

- For "note this down" or a passing idea, use capture. Start a note with "[]" to add tasks instead (one per line) to the Tasks page.
- To find a note, use search or list-notebook. Never guess a path.
- write-note replaces the whole note and works only on an existing one. Always read-note first and pass back `modified` exactly as read-note returned it. If the reply says the note changed, read it again, apply the change to the new content and write again. To add a line, read, append, write.
- To tick a task, use open-tasks (or read-note) and pass the task's line and text to set-task unchanged.
- trash-note is recoverable: keep both returned paths if you may need restore-note. There is no permanent delete.
- These notes are the user's own writing. Change, move, rename or trash a note only when the user asked for it.
```

- [ ] **Step 3: The server.** Create `crates/mcp/src/server.rs`:

```rust
//! The MCP side: tool definitions and replies. Each tool calls one `Notebook` method.

use crate::notebook::{Notebook, ToolError};
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, ContentBlock, Implementation, ServerCapabilities, ServerConfig};
use rmcp::{ErrorData as McpError, ServerHandler, schemars, tool, tool_handler, tool_router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
pub struct Server {
    nb: Arc<Notebook>,
    #[allow(dead_code, reason = "read by the code tool_handler generates")]
    tool_router: ToolRouter<Self>,
}

/// JSON for a result, or the message as a tool error the agent can act on.
fn reply<T: Serialize>(result: Result<T, ToolError>) -> Result<CallToolResult, McpError> {
    match result {
        Ok(value) => Ok(CallToolResult::success(vec![ContentBlock::json(value)?])),
        Err(ToolError(message)) => Ok(CallToolResult::error(vec![ContentBlock::text(message)])),
    }
}

fn done(result: Result<(), ToolError>) -> Result<CallToolResult, McpError> {
    reply(result.map(|()| serde_json::json!({ "ok": true })))
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct CaptureArgs {
    /// 1 to 20 notes. Each is saved on its own. A note starting with "[]" adds its lines as tasks to the Tasks page.
    pub notes: Vec<String>,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct PathArgs {
    /// Path of the note inside the notebook, '/'-separated, ending in .md, as list-notebook, list-inbox or search return it.
    pub path: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct SearchArgs {
    /// Text to look for in titles and note text (case-insensitive).
    pub query: String,
    /// How many hits to return, 1 to 50. Default 20.
    pub limit: Option<usize>,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct SetTaskArgs {
    /// Page holding the task, as open-tasks returns it.
    pub path: String,
    /// The task's 0-based line, as open-tasks returns it.
    pub line: usize,
    /// The task's text, exactly as open-tasks returns it.
    pub text: String,
    /// true ticks the task, false unticks it.
    pub done: bool,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct WriteArgs {
    /// Path of an existing note.
    pub path: String,
    /// The whole new content of the note (Markdown).
    pub content: String,
    /// `modified` exactly as read-note returned it.
    pub modified: i64,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct FolderArgs {
    /// Folder name; "Parent/Child" makes nested folders.
    pub name: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct CreatePageArgs {
    /// Folder for the page, "" for the notebook's root. Created if missing.
    pub folder: String,
    /// Page title; it becomes the file name.
    pub title: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct RenameArgs {
    /// Path of the note.
    pub path: String,
    /// New title (the file name without .md).
    pub title: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct MoveArgs {
    /// Path of the note.
    pub path: String,
    /// Target folder, "" for the root. Inbox notes moved out get a title from their first line.
    pub folder: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RestoreArgs {
    /// `trashPath` as trash-note returned it.
    pub trash_path: String,
    /// `originalPath` as trash-note returned it.
    pub original_path: String,
}

#[tool_router]
impl Server {
    pub fn new(nb: Notebook) -> Self {
        Server { nb: Arc::new(nb), tool_router: Self::tool_router() }
    }

    #[tool(
        name = "capture",
        description = "Save quick notes to the Flashjot Inbox, or tasks to the Tasks page when a note starts with \"[]\". Returns each note's outcome.",
        annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false)
    )]
    async fn capture(&self, Parameters(args): Parameters<CaptureArgs>) -> Result<CallToolResult, McpError> {
        if args.notes.is_empty() || args.notes.len() > 20 {
            return reply::<()>(Err(ToolError("Give 1 to 20 notes.".into())));
        }
        let now = chrono::Local::now().naive_local();
        reply(Ok(self.nb.capture(&args.notes, now)))
    }

    #[tool(name = "list-inbox", description = "Inbox notes, newest first, with a short preview.", annotations(read_only_hint = true, open_world_hint = false))]
    async fn list_inbox(&self) -> Result<CallToolResult, McpError> {
        reply(self.nb.list_inbox())
    }

    #[tool(
        name = "list-notebook",
        description = "Markdown overview of the notebook: the Inbox count, root pages, and each folder with its pages (paths included).",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn list_notebook(&self) -> Result<CallToolResult, McpError> {
        match self.nb.overview() {
            Ok(md) => Ok(CallToolResult::success(vec![ContentBlock::text(md)])),
            Err(e) => reply::<()>(Err(e)),
        }
    }

    #[tool(
        name = "read-note",
        description = "A note's content and `modified` time. Pass `modified` back unchanged to write-note.",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn read_note(&self, Parameters(args): Parameters<PathArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.read(&args.path))
    }

    #[tool(name = "search", description = "Find notes whose title or text contains the query. Newest first.", annotations(read_only_hint = true, open_world_hint = false))]
    async fn search(&self, Parameters(args): Parameters<SearchArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.search(&args.query, args.limit.unwrap_or(20)))
    }

    #[tool(
        name = "open-tasks",
        description = "Every unchecked task, grouped by page (Tasks page first), with each task's 0-based line and text.",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn open_tasks(&self) -> Result<CallToolResult, McpError> {
        reply(self.nb.open_tasks())
    }

    #[tool(
        name = "set-task",
        description = "Tick or untick one task. Refused if that line no longer holds this task; then call open-tasks again.",
        annotations(read_only_hint = false, destructive_hint = false, idempotent_hint = true, open_world_hint = false)
    )]
    async fn set_task(&self, Parameters(a): Parameters<SetTaskArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.set_task(&a.path, a.line, &a.text, a.done))
    }

    #[tool(
        name = "write-note",
        description = "Replace the whole content of an existing note. Call read-note first and pass `modified` exactly as it returned it; refused if the note changed since.",
        annotations(read_only_hint = false, destructive_hint = true, open_world_hint = false)
    )]
    async fn write_note(&self, Parameters(a): Parameters<WriteArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.write(&a.path, &a.content, a.modified).map(|modified| serde_json::json!({ "modified": modified })))
    }

    #[tool(name = "create-folder", description = "Create a folder (nested with \"Parent/Child\").", annotations(read_only_hint = false, destructive_hint = false, idempotent_hint = true, open_world_hint = false))]
    async fn create_folder(&self, Parameters(a): Parameters<FolderArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.create_folder(&a.name))
    }

    #[tool(name = "create-page", description = "Create an empty page; returns its path. Then use write-note to fill it.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn create_page(&self, Parameters(a): Parameters<CreatePageArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.create_page(&a.folder, &a.title))
    }

    #[tool(name = "rename-note", description = "Give a note a new title; returns its new path.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn rename_note(&self, Parameters(a): Parameters<RenameArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.rename(&a.path, &a.title))
    }

    #[tool(name = "move-note", description = "Move a note to another folder; returns its new path.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn move_note(&self, Parameters(a): Parameters<MoveArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.move_to(&a.path, &a.folder))
    }

    #[tool(
        name = "trash-note",
        description = "Move a note to the trash (recoverable). Returns trashPath and originalPath for restore-note.",
        annotations(read_only_hint = false, destructive_hint = true, open_world_hint = false)
    )]
    async fn trash_note(&self, Parameters(a): Parameters<PathArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.trash(&a.path))
    }

    #[tool(name = "restore-note", description = "Bring a trashed note back to where it was.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn restore_note(&self, Parameters(a): Parameters<RestoreArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.restore(&a.trash_path, &a.original_path))
    }
}

#[tool_handler]
impl ServerHandler for Server {
    fn get_info(&self) -> ServerConfig {
        ServerConfig::new(ServerCapabilities::builder().enable_tools().build())
            .with_server_info(Implementation::new("flashjot-mcp", env!("CARGO_PKG_VERSION")))
            .with_instructions(include_str!("instructions.md"))
    }
}
```

- [ ] **Step 4: `main.rs`.** Replace `crates/mcp/src/main.rs`:

```rust
//! flashjot-mcp: an MCP server over stdio for a Flashjot notebook. MCP clients start it;
//! stdout carries only protocol messages, so everything else goes to stderr.

mod notebook;
mod server;

use rmcp::ServiceExt;
use std::path::PathBuf;

const USAGE: &str = "Usage: flashjot-mcp [--notes-dir <folder>] [--settings <settings.json>]

An MCP server (stdio) for Flashjot notes. Without options it uses the same notes folder as
the Flashjot app. Add it to Claude Code with:  claude mcp add flashjot -- flashjot-mcp";

struct Args {
    notes_dir: Option<PathBuf>,
    settings: Option<PathBuf>,
}

fn parse_args(mut args: impl Iterator<Item = String>) -> Result<Option<Args>, String> {
    let mut out = Args { notes_dir: None, settings: None };
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--notes-dir" => out.notes_dir = Some(args.next().ok_or("--notes-dir needs a folder")?.into()),
            "--settings" => out.settings = Some(args.next().ok_or("--settings needs a file")?.into()),
            "--help" | "-h" => return Ok(None),
            "--version" | "-V" => {
                println!("flashjot-mcp {}", env!("CARGO_PKG_VERSION"));
                std::process::exit(0);
            }
            other => return Err(format!("unknown option {other}")),
        }
    }
    Ok(Some(out))
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args = match parse_args(std::env::args().skip(1)) {
        Ok(Some(args)) => args,
        Ok(None) => {
            println!("{USAGE}");
            return;
        }
        Err(e) => {
            eprintln!("flashjot-mcp: {e}\n\n{USAGE}");
            std::process::exit(2);
        }
    };
    let nb = match notebook::Notebook::open(args.notes_dir, args.settings) {
        Ok(nb) => nb,
        Err(e) => {
            eprintln!("flashjot-mcp: notes folder: {e}");
            std::process::exit(1);
        }
    };
    eprintln!("flashjot-mcp: notes in {}", nb.root().display());
    let service = match server::Server::new(nb).serve(rmcp::transport::stdio()).await {
        Ok(service) => service,
        Err(e) => {
            eprintln!("flashjot-mcp: {e}");
            std::process::exit(1);
        }
    };
    if let Err(e) = service.waiting().await {
        eprintln!("flashjot-mcp: {e}");
    }
}
```

- [ ] **Step 5: Run every test**

Run: `cargo test --workspace && cargo clippy --workspace --all-targets -- -D warnings`
Expected: PASS: `flashjot-mcp` 15 unit tests + 1 stdio test, no warnings.

- [ ] **Step 6: Commit**

```bash
git add crates/mcp
git commit -m "feat(mcp): flashjot-mcp, an MCP server over stdio with 14 tools

<Co-Authored-By line>"
```

### Task 9: Try it with a real client; open PR 3

**Files:**
- Modify: `docs/manual-test.md`, `CHANGELOG.md`

**Interfaces:** none.

- [ ] **Step 1: Inspect it with the MCP Inspector** (lists tools, schemas and annotations; lets you call each tool by hand):

```bash
cargo build -p flashjot-mcp
mkdir -p /tmp/fj-mcp-notes
npx @modelcontextprotocol/inspector ./target/debug/flashjot-mcp --notes-dir /tmp/fj-mcp-notes
```

Check: 14 tools; `read-note`, `list-*`, `search`, `open-tasks` show `readOnlyHint: true`; `write-note` and `trash-note` show `destructiveHint: true`; the server instructions appear.

- [ ] **Step 2: With Claude Code and the app running** (notes folder pointed at a scratch folder in Flashjot's Settings; Phase 2 merged):

```bash
claude mcp add flashjot -- "$PWD/target/debug/flashjot-mcp"
```

In Claude Code, ask: "Note down: try the MCP server", then "add a task: water the plants", then "what are my open tasks?", then "tick that task". Each change must show in the open Flashjot notebook within a second. Remove it afterwards: `claude mcp remove flashjot`.

- [ ] **Step 3: Manual test section.** Add to `docs/manual-test.md`:

```markdown
## MCP server (flashjot-mcp)
- [ ] `flashjot-mcp --version` prints the version; `--help` prints the usage.
- [ ] In the MCP Inspector: 14 tools; read-only and destructive hints as in the plan; the instructions show.
- [ ] From Claude Code: a captured note appears in the open notebook's Inbox within a second.
- [ ] `[] water the plants` lands on the same Tasks page the quick box uses.
- [ ] Edit a page in Flashjot after the agent read it; the agent's write-note is refused with "changed since it was read".
- [ ] trash-note then restore-note brings the page back where it was.
- [ ] The settings file is unchanged after a session (`sha256sum` before and after).
```

- [ ] **Step 4: Changelog.** Under `## [Unreleased]`, `### Added`: `- flashjot-mcp: an MCP server so AI agents (Claude Code, Claude Desktop, Cursor…) can capture, read, search and organise your notes, with the app's own rules. Nothing is ever deleted for good.`

- [ ] **Step 5: Commit, push, PR 3**

```bash
git add docs/manual-test.md CHANGELOG.md
git commit -m "docs: manual checks for flashjot-mcp

<Co-Authored-By line>"
git push -u origin feat/mcp-server
gh pr create --title "feat: flashjot-mcp, an MCP server for Flashjot notes" --body "Step 3 of docs/superpowers/plans/2026-11-23-flashjot-mcp.md (spec: docs/superpowers/specs/2026-11-23-flashjot-mcp-design.md).

<PR attribution line>"
```

---

# Phase 4: ship it with the app, and document it (PR 4)

### Task 10: Bundle the server in the installers and attach it to releases

**Files:**
- Create: `scripts/mcp-sidecar.mjs`, `src-tauri/tauri.mcp.conf.json`
- Modify: `package.json` (scripts), `.gitignore`, `.github/workflows/release.yml`

**Interfaces:**
- Produces: `node scripts/mcp-sidecar.mjs [target-triple]` → `src-tauri/binaries/flashjot-mcp-<triple>[.exe]`; `npm run tauri:release` (local installer build with the server).

- [ ] **Step 1: Branch**

```bash
cd ~/flashjot && git checkout main && git pull --ff-only && git checkout -b feat/mcp-release
```

- [ ] **Step 2: The sidecar script.** Create `scripts/mcp-sidecar.mjs`:

```js
// Builds flashjot-mcp for one target and copies it to src-tauri/binaries/ under the name Tauri's
// externalBin expects (flashjot-mcp-<target triple>[.exe]). Usage: node scripts/mcp-sidecar.mjs [triple]
// It always builds with --target, so its output never shares a folder with the app's own build,
// where tauri-build copies the sidecar under the plain name flashjot-mcp.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";

const host = execFileSync("rustc", ["-vV"]).toString().match(/^host: (.+)$/m)[1];
const target = process.argv[2] || host;
const ext = target.includes("windows") ? ".exe" : "";

execFileSync("cargo", ["build", "--release", "-p", "flashjot-mcp", "--target", target], { stdio: "inherit" });
mkdirSync("src-tauri/binaries", { recursive: true });
copyFileSync(`target/${target}/release/flashjot-mcp${ext}`, `src-tauri/binaries/flashjot-mcp-${target}${ext}`);
console.log(`src-tauri/binaries/flashjot-mcp-${target}${ext}`);
```

Create `src-tauri/tauri.mcp.conf.json` (merged into `tauri.conf.json` only for release builds; see "Spec deviations" 4):

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "bundle": {
    "externalBin": ["binaries/flashjot-mcp"]
  }
}
```

In `package.json` scripts add: `"tauri:release": "node scripts/mcp-sidecar.mjs && tauri build --config src-tauri/tauri.mcp.conf.json"`. In `.gitignore` add `/src-tauri/binaries/`.

- [ ] **Step 3: Check a local installer.** On Linux:

```bash
npm run build && node scripts/mcp-sidecar.mjs && npx tauri build --bundles deb --config src-tauri/tauri.mcp.conf.json
dpkg -c target/release/bundle/deb/*.deb | grep usr/bin
```

Expected: `./usr/bin/flashjot` and `./usr/bin/flashjot-mcp` (verified on 2026-11-23, see "Installed paths" below). Then `cargo test --workspace` still passes without `src-tauri/binaries/` present (delete the folder and re-run), proving dev builds don't need the sidecar.

- [ ] **Step 4: Release workflow.** In `.github/workflows/release.yml`:

  - give every matrix entry its target triple:

```yaml
        include:
          - platform: macos-latest
            args: --target aarch64-apple-darwin
            target: aarch64-apple-darwin
          - platform: macos-latest
            args: --target x86_64-apple-darwin
            target: x86_64-apple-darwin
          # 22.04 keeps glibc old enough for Debian 12 / Pardus 23 and Ubuntu 22.04.
          - platform: ubuntu-22.04
            args: ""
            target: x86_64-unknown-linux-gnu
          - platform: windows-latest
            args: ""
            target: x86_64-pc-windows-msvc
```

  - after `- run: npm ci`, add:

```yaml
      - name: Build flashjot-mcp for the installers
        run: node scripts/mcp-sidecar.mjs ${{ matrix.target }}
```

  - give the `tauri-apps/tauri-action@v1` step `id: tauri` and change its `args` to `${{ matrix.args }} --config src-tauri/tauri.mcp.conf.json`;
  - after it, add:

```yaml
      # The server on its own, for machines without the app (spec §7).
      - name: Attach flashjot-mcp to the release
        shell: bash
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          RELEASE_ID: ${{ steps.tauri.outputs.releaseId }}
        run: |
          T=${{ matrix.target }}
          if [[ $T == *windows* ]]; then
            NAME=flashjot-mcp-$T.exe
            cp "target/$T/release/flashjot-mcp.exe" "$NAME"
          else
            NAME=flashjot-mcp-$T.tar.gz
            tar -czf "$NAME" -C "target/$T/release" flashjot-mcp
          fi
          gh api --method POST -H "Content-Type: application/octet-stream" \
            "https://uploads.github.com/repos/${{ github.repository }}/releases/$RELEASE_ID/assets?name=$NAME" \
            --input "$NAME"
```

  Not run in this plan's preparation: try it with `workflow_dispatch` on the branch (Actions → Release → Run workflow) before merging, and check that the draft release has the four `flashjot-mcp-*` files and that each installer contains the server.

- [ ] **Step 5: Commit**

```bash
git add scripts/mcp-sidecar.mjs src-tauri/tauri.mcp.conf.json package.json .gitignore .github/workflows/release.yml
git commit -m "build: ship flashjot-mcp in the installers and on the release page

<Co-Authored-By line>"
```

#### Installed paths

Where the installers put `flashjot-mcp` (Tauri strips the target triple from sidecar names). These go in the docs page of Task 11.

| Installer | Path | How it was established |
|---|---|---|
| `.deb` | `/usr/bin/flashjot-mcp` | built and listed with `dpkg -c` on 2026-11-23 |
| `.rpm` | `/usr/bin/flashjot-mcp` | same bundler layout as `.deb` (not built here) |
| AppImage | inside the image only, not on `PATH` | Tauri bundles sidecars into the AppDir's `usr/bin`; use the standalone `flashjot-mcp-x86_64-unknown-linux-gnu.tar.gz` instead (not built here) |
| macOS `.dmg` | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` | Tauri's sidecar location on macOS (not built here) |
| Windows NSIS `.exe` (per user, the default) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` | next to `Flashjot.exe` (not built here) |
| Windows `.msi` | `C:\Program Files\Flashjot\flashjot-mcp.exe` | next to `Flashjot.exe` (not built here) |

Check the four "not built here" rows from the workflow_dispatch run in Step 4 and correct the docs if one differs.

### Task 11: The "Use with AI agents" page; open PR 4

**Files:**
- Create: `docs-site/src/content/docs/guide/ai-agents.md`, `docs-site/src/content/docs/tr/guide/ai-agents.md`
- Modify: `docs-site/astro.config.mjs` (sidebar), `README.md` (new section after "Where are my notes?"), `CHANGELOG.md`, `docs-site/src/content/docs/development/architecture.md`

**Interfaces:** none.

- [ ] **Step 1: The English page.** `docs-site/src/content/docs/guide/ai-agents.md`:

````markdown
---
title: Use with AI agents
description: Let Claude Code, Claude Desktop, Cursor and other MCP clients capture, read and organise your Flashjot notes.
---

Flashjot comes with `flashjot-mcp`, an [MCP](https://modelcontextprotocol.io) server. With it, an
AI agent can save a quick note to your Inbox, add tasks, search and read your notes, tick tasks,
and file, rename or trash pages, following the same rules as the app.

- It works whether or not Flashjot is open. When it is open, changes show within a second.
- It never deletes anything for good: trashed notes stay in the trash, as when you delete them.
- It never changes your settings.
- It refuses to overwrite a page you changed after the agent read it.

## Where the server is

| You installed | Path |
|---|---|
| `.deb` or `.rpm` | `/usr/bin/flashjot-mcp` |
| macOS app | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` |
| Windows (`.exe` installer) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` |
| Windows (`.msi`) | `C:\Program Files\Flashjot\flashjot-mcp.exe` |
| AppImage, or no app | download `flashjot-mcp-…` for your system from the [latest release](https://github.com/mftnakrsu/flashjot/releases/latest) |

On macOS, open Flashjot once first, so the system allows its programs to run.

## Claude Code

```bash
claude mcp add flashjot -- /usr/bin/flashjot-mcp
```

Use the path from the table for your system.

## Claude Desktop, Cursor and other clients

Add this to the client's MCP settings (for Claude Desktop: Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "flashjot": { "command": "/usr/bin/flashjot-mcp" }
  }
}
```

## Options

- `--notes-dir <folder>`: use another notes folder, for example an Obsidian vault.
- `--settings <file>`: read settings from another file.

Without options the server uses the notes folder chosen in Flashjot's Settings. If you change that
folder, restart the server (in most clients: restart the client).

## What the agent can do

| Tool | What it does |
|---|---|
| `capture` | Saves quick notes to the Inbox; a note starting with `[]` adds tasks to the Tasks page |
| `list-inbox`, `list-notebook` | Lists the Inbox, or every folder and page |
| `read-note`, `search` | Reads a page; searches titles and text |
| `open-tasks`, `set-task` | Lists unchecked tasks; ticks or unticks one |
| `write-note` | Replaces a page's text, only if you haven't changed it since the agent read it |
| `create-folder`, `create-page`, `rename-note`, `move-note` | Organises pages |
| `trash-note`, `restore-note` | Moves a page to the trash, or brings it back |
````

- [ ] **Step 2: The Turkish page.** `docs-site/src/content/docs/tr/guide/ai-agents.md`, same structure and code blocks:

````markdown
---
title: Yapay zekâ ajanlarıyla kullanım
description: Claude Code, Claude Desktop, Cursor ve diğer MCP istemcilerinin Flashjot notlarını yakalamasına, okumasına ve düzenlemesine izin verin.
---

Flashjot, bir [MCP](https://modelcontextprotocol.io) sunucusu olan `flashjot-mcp` ile gelir. Bu
sayede bir yapay zekâ ajanı Gelen Kutusu'na hızlı not kaydedebilir, görev ekleyebilir, notlarında
arama yapıp okuyabilir, görevleri işaretleyebilir ve sayfaları taşıyıp yeniden adlandırabilir ya da
çöpe atabilir. Hepsini uygulamayla aynı kurallarla yapar.

- Flashjot açık olsa da olmasa da çalışır. Açıksa değişiklikler bir saniye içinde görünür.
- Hiçbir şeyi kalıcı olarak silmez: çöpe atılan notlar, senin sildiklerin gibi çöpte kalır.
- Ayarlarını hiç değiştirmez.
- Ajan okuduktan sonra senin değiştirdiğin bir sayfanın üzerine yazmayı reddeder.

## Sunucu nerede

| Kurduğun | Yol |
|---|---|
| `.deb` ya da `.rpm` | `/usr/bin/flashjot-mcp` |
| macOS uygulaması | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` |
| Windows (`.exe` kurulumu) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` |
| Windows (`.msi`) | `C:\Program Files\Flashjot\flashjot-mcp.exe` |
| AppImage ya da uygulama yok | [son sürümden](https://github.com/mftnakrsu/flashjot/releases/latest) sistemine uygun `flashjot-mcp-…` dosyasını indir |

macOS'ta önce Flashjot'u bir kez aç ki sistem programlarının çalışmasına izin versin.

## Claude Code

```bash
claude mcp add flashjot -- /usr/bin/flashjot-mcp
```

Tablodaki, sistemine uygun yolu kullan.

## Claude Desktop, Cursor ve diğer istemciler

Bunu istemcinin MCP ayarlarına ekle (Claude Desktop için: Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "flashjot": { "command": "/usr/bin/flashjot-mcp" }
  }
}
```

## Seçenekler

- `--notes-dir <klasör>`: başka bir not klasörü kullanır, örneğin bir Obsidian kasası.
- `--settings <dosya>`: ayarları başka bir dosyadan okur.

Seçeneksiz çalışınca sunucu, Flashjot Ayarları'nda seçili not klasörünü kullanır. O klasörü
değiştirirsen sunucuyu yeniden başlat (çoğu istemcide: istemciyi yeniden başlat).

## Ajan neler yapabilir

| Araç | Ne yapar |
|---|---|
| `capture` | Hızlı notları Gelen Kutusu'na kaydeder; `[]` ile başlayan not, Görevler sayfasına görev ekler |
| `list-inbox`, `list-notebook` | Gelen Kutusu'nu ya da tüm klasör ve sayfaları listeler |
| `read-note`, `search` | Bir sayfayı okur; başlıklarda ve metinde arar |
| `open-tasks`, `set-task` | İşaretlenmemiş görevleri listeler; birini işaretler ya da işaretini kaldırır |
| `write-note` | Bir sayfanın metnini değiştirir; ama ajan okuduktan sonra sen değiştirmediysen |
| `create-folder`, `create-page`, `rename-note`, `move-note` | Sayfaları düzenler |
| `trash-note`, `restore-note` | Bir sayfayı çöpe atar ya da geri getirir |
````

- [ ] **Step 3: Sidebar and other docs.**
  - `docs-site/astro.config.mjs`, "User guide" items: add `'guide/ai-agents'` after `'guide/your-notes'`.
  - `README.md`, new section after "Where are my notes?":

```markdown
## Use with AI agents

Flashjot ships `flashjot-mcp`, an MCP server, so Claude Code, Claude Desktop, Cursor and other
agents can capture, read, search and organise your notes with the app's own rules. Nothing is ever
deleted for good. Setup: [flashjot.mefby.com/guide/ai-agents](https://flashjot.mefby.com/guide/ai-agents/).

```bash
claude mcp add flashjot -- /usr/bin/flashjot-mcp   # path depends on your system, see the guide
```
```

  - `docs-site/src/content/docs/development/architecture.md`, after the paragraph added in Task 2: `` `crates/mcp` (`flashjot-mcp`) is the MCP server: `notebook.rs` maps each tool onto `flashjot-core`, `server.rs` defines the tools with `rmcp`. ``
  - `CHANGELOG.md` under `## [Unreleased]`, `### Added`: `- Installers include flashjot-mcp; the release page also has it on its own for each system.`

- [ ] **Step 4: Build the docs site**

Run: `cd docs-site && npm run build`
Expected: builds with no broken-link warnings; `dist/guide/ai-agents/index.html` and `dist/tr/guide/ai-agents/index.html` exist.

- [ ] **Step 5: Commit, push, PR 4**

```bash
git add docs-site README.md CHANGELOG.md
git commit -m "docs: Use with AI agents, in English and Turkish

<Co-Authored-By line>"
git push -u origin feat/mcp-release
gh pr create --title "build, docs: ship flashjot-mcp with the app" --body "Step 4 of docs/superpowers/plans/2026-11-23-flashjot-mcp.md.

<PR attribution line>"
```

---

## Self-review (2026-11-23)

Spec coverage, section by section:

- §1 code layout → Tasks 1–2 (workspace, `flashjot-core`, CI and docs paths).
- §2 finding the notes folder → `location.rs` (Task 1), `Notebook::open` and `--notes-dir`/`--settings` (Tasks 7–8), never writing settings → `settings::peek` (Task 6) and the test `the_server_never_writes_settings` (Task 7).
- §3 tools, instructions, Markdown overview, batch capture → Tasks 7–8; the search limit differs (deviation 1).
- §4 next to the running app → #21 in Tasks 3–5; conflicts → `write_needs_the_time_from_read`, `set_task_refuses_a_line_that_changed`; Tasks page → three tests in Task 7.
- §5 errors → `message()` in Task 7; logs only on stderr → `main.rs` (Task 8).
- §6 testing → unit tests (Tasks 1, 3, 6, 7), stdio test (Task 8), manual checks (Tasks 5, 9), CI (Task 2).
- §7 distribution → Task 10 (installers via a release-only config, standalone files), Task 11 (docs).
- §8 order of work → Phases 1–4, one PR each.
- Open questions → rmcp/edition 2024 resolved (finding 8); install paths: `.deb` verified, others from Tauri's layout, to be checked in Task 10 Step 4.

Names used across tasks were checked against each other: `watch::spawn`/`Watch`/`watch_notes`, `nb.reloadOpen`, `settings::peek`, `Notebook::{open, capture, overview, …}`, `Captured`, `Trashed` (`trashPath`/`originalPath` match `RestoreArgs`), `SEARCH_MAX`, the 14 tool names (the stdio test lists them).
