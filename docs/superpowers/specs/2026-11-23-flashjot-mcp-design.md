# MCP server (flashjot-mcp): design

Date: 2026-11-23. Related issue: #21 (watch the notes folder), a prerequisite.

## Goal

Let AI agents (Claude Code, Claude Desktop, Cursor and any other MCP client) use a Flashjot
notebook: capture a quick note or tasks, read and search notes, list open tasks, and organise
pages, with the same rules the app follows. A typical use: an agent says "I'll note that down"
in the middle of a task, and the note appears in the Flashjot Inbox.

Decisions made while designing:

- **Flashjot only.** The server serves the Flashjot notes folder and knows its layout (Inbox,
  folders, the Tasks page, `.trash`). It is not a general server for any Markdown folder. People
  who use Obsidian point Flashjot's notes folder into their vault (or start the server with
  `--notes-dir`).
- **Full access.** Agents can capture, read, search, write, tick tasks, create, rename, move,
  trash and restore. They cannot delete permanently or change settings.
- **A separate small program**, `flashjot-mcp`, that MCP clients start themselves over stdio. It
  works whether or not the app is running.
- **One copy of the rules.** The note logic moves into a shared crate that both the app and the
  server use.

Out of scope: emptying the trash, changing settings, a general Markdown-folder mode, HTTP
transport, MCP resources and prompts (tools only), listing the trash, the Wayland shortcut work
(#20) and the performance work.

## 1. Code layout

The repository becomes a Cargo workspace:

```
Cargo.toml              workspace: members = ["src-tauri", "crates/core", "crates/mcp"]
crates/core/            flashjot-core: store.rs, settings.rs, notes_root/default_root, locations
crates/mcp/             flashjot-mcp: the MCP server binary
src-tauri/              the app, now depending on flashjot-core
```

- `store.rs` and `settings.rs` already have no Tauri dependency (serde, chrono, std only) and move
  unchanged, with their tests. `notes_root`, `default_root` and the code that opens a store with a
  fallback move from `commands.rs` into the core, so the app and the server pick the same folder.
- The app's commands keep their names and signatures, so the frontend does not change.
- The move is its own pull request: the existing tests passing after it is the proof that nothing
  changed. Release and CI paths that assume `src-tauri/target` are updated in the same pull request.
- The server uses the official Rust MCP SDK (`rmcp`) with the stdio transport.

## 2. Finding the notes folder

1. Settings: the same file the app uses, `<config dir>/io.github.mftnakrsu.flashjot/settings.json`
   (Tauri's `app_config_dir`: `~/.config/…` on Linux, `~/Library/Application Support/…` on macOS,
   `%APPDATA%\…` on Windows). The path is computed in the core from the identifier, so it cannot
   drift from the app's.
2. The notes folder is `notesDir` from the settings when set, otherwise `<Documents>/Flashjot`, using
   the same function as the app.
3. `--notes-dir <path>` overrides both. `--settings <path>` overrides the settings file (for tests).
4. The server **never writes the settings file**. Only the app does.
5. If the folder does not exist, the server creates it, as the app does on start.

## 3. Tools

Names follow the dash style common to MCP servers. Paths are relative to the notes folder and
always `/`-separated, exactly as `NoteMeta.path` in the store. Every tool maps to an existing store
function; the server adds no note logic of its own.

| Tool | Input | Store function | Result |
|---|---|---|---|
| `capture` | `notes: string[]` (1–20) | `add_inbox`, or `parse_tasks` + `add_tasks` when a note starts with `[]` | per note: Inbox note path, or the Tasks page path |
| `list-inbox` | none | `list_inbox` | Inbox notes, newest first: path, title, modified |
| `list-notebook` | none | `tree` | Markdown overview of root pages and folders with their pages (paths included) |
| `read-note` | `path` | `read` | content and `modified` |
| `search` | `query`, `limit` (default 20, max 100) | `search` | hits: path, title, snippet (the server keeps the first `limit`) |
| `open-tasks` | none | `open_tasks` | unchecked tasks grouped by page: path, title, and each task's 0-based `line` and `text` |
| `set-task` | `path`, `line` (0-based, from open-tasks), `text`, `done` | `set_task` | ok, or conflict |
| `write-note` | `path`, `content`, `modified` | `write` with `expected = modified` | new `modified`, or conflict |
| `create-folder` | `name` | `create_folder` | ok |
| `create-page` | `folder`, `title` | `create_page` | new page's path |
| `rename-note` | `path`, `title` | `rename` | new path |
| `move-note` | `path`, `folder` | `move_to` | new path |
| `trash-note` | `path` | `trash` | trash path and original path (both needed to restore) |
| `restore-note` | `trashPath`, `originalPath` | `restore` | ok |

Not exposed: `empty_trash` (permanent deletion), `trash_count`, settings.

`capture` takes an array, so an agent can save several notes in one call. Each note is saved on its
own; one failure (an empty note) does not undo the others, and the result lists each note's outcome.

`list-notebook` returns Markdown, not JSON, because agents read it more cheaply and reliably:

```
# Notebook (/home/me/Documents/Flashjot)
- Inbox (3 notes)
- Tasks.md
## Projects
- Projects/Flashjot ideas.md
- Projects/Reading list.md
```

Other tools return JSON text.

### Server instructions

The server sends MCP `instructions` that tell the agent which tool to use when, as the Todoist
server does. The points it covers:

- For "note this down" or a passing idea, use `capture`. Start the text with `[]` to add tasks
  (one per line) to the Tasks page.
- Always `read-note` before `write-note`, and pass `modified` exactly as `read-note` returned it.
  On a conflict, read the note again, apply the change to the new content and write again. Never
  write without reading.
- `write-note` replaces the whole note. To add a line, read, append, write.
- To find a note, use `search` or `list-notebook`; do not guess paths.
- `trash-note` is recoverable: keep both returned paths if you may need `restore-note`. There is no
  permanent delete.
- Notes are the user's own writing. Change or trash a note only when the user asked for it.

Each tool's own description repeats the rule that matters for it (for example, `write-note`:
"Pass `modified` exactly as read-note returned it").

## 4. Working next to the running app

- **The app shows what the server writes** once #21 is done: the app watches the notes folder and
  emits `notes-changed` when files change (debounced), so lists, the Inbox and open tasks reload.
  Without #21 the app shows the server's changes only after its own next reload. #21 is therefore
  done before the server is released.
- **No lost writes.** `write-note` uses the store's existing `expected` check: if the user saved the
  note in the app (or any other program) after the agent read it, the write is refused with a
  conflict. The app's autosave uses the same check in the other direction. `set-task` already checks
  that the line still holds the same task. All saves stay atomic (temporary file, then rename).
- **The Tasks page.** The app stores the page's path in settings (`tasksPage`) the first time a task
  is added; the server never writes settings. So the server picks the page like this:
  1. `tasksPage` from settings, if set and the file exists.
  2. Otherwise, if exactly one of `Tasks.md` and `Görevler.md` exists at the root, that file.
  3. Otherwise `<root>/<title>.md`, where the title follows the `language` setting: `en` gives
     "Tasks", `tr` gives "Görevler", and `auto` uses the system locale (Turkish when it starts with
     `tr`, as the UI's `detect()` does with `navigator.language`).
  The app adopts the page on its next task (its existing rule: if a file with the localized name
  exists, append to it and store its path). Step 2 avoids a second page when the server's guess
  of the locale differs from the web view's.

## 5. Errors

Store errors become MCP tool errors (`isError: true`) with a short message an agent can act on:

| Store error | Message |
|---|---|
| `Empty` | "The note is empty." |
| `InvalidPath`, `NotFound` | "No note at <path>. Use search or list-notebook to find it." |
| `InvalidName`, `ReservedName` | "<name> can't be used as a name (…reason…)." |
| `Conflict` | "The note changed since it was read. Read it again and redo the change." |
| `Io` | the system error text |

Paths are checked by the store as today (no `..`, nothing outside the notes folder). The server
writes nothing to stdout except protocol messages; logs go to stderr and never contain note text.

## 6. Testing

1. **The move.** All existing store and settings tests pass in `flashjot-core`; the app builds and
   its tests pass unchanged.
2. **Each tool** runs against a temporary notes folder: capture of a note and of `[]` tasks,
   capture of several notes with one empty, write with a stale `modified` refused, set-task on a
   changed line refused, trash then restore, paths outside the folder refused, Tasks page choice
   (settings, existing `Tasks.md`/`Görevler.md`, language).
3. **End to end.** A test starts the built `flashjot-mcp` with `--notes-dir` on a temporary folder,
   sends `initialize`, `tools/list` and a few `tools/call` messages over stdio, and checks the replies
   and the files on disk.
4. **Manually.** Connect the server to Claude Code, capture a note, and see it appear in the running
   app's Inbox (with #21 in place). Written up in `docs/manual-test.md`.
5. CI runs `cargo test` for the whole workspace.

## 7. Distribution

- **With the app:** the installers include `flashjot-mcp` through Tauri's `bundle.externalBin`. The
  release workflow builds the server for each target first and places it under the name the bundler
  expects (`flashjot-mcp-<target triple>`).
- **On its own:** the release also carries a `flashjot-mcp` archive per platform, for machines
  without the app.
- **Setup docs:** a "Use with AI agents" page on flashjot.mefby.com in English and Turkish, with
  `claude mcp add flashjot -- flashjot-mcp` for Claude Code and the JSON snippet for Claude Desktop
  and other clients, including where the binary lives after installing the app on each platform.
  The README gets a short section linking to it.

## 8. Order of work

Each step is its own pull request:

1. Workspace and `flashjot-core` (the move; no behaviour change).
2. #21: the app watches the notes folder.
3. `flashjot-mcp` with its tests.
4. Bundling, release archives and docs.

## Open questions

- Where `externalBin` places the binary on each platform, and whether that path is easy to type in
  an MCP client's config, decides how the setup docs read; checked in step 4.
- Whether `rmcp`'s current version builds on all release targets with the project's `edition =
  "2024"` and release profile; checked at the start of step 3.
