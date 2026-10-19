# Flashjot — Design Spec

Date: 2026-10-19 · Status: approved in chat

## 1. Goal

A cross-platform (Linux incl. Pardus, Windows, macOS) open-source note app with two modes:

1. **Quick capture** — a global hotkey pops a small box, you type a thought, press Enter, it is saved and the box disappears. Target: idea → saved in ~3 s.
2. **Notebook** — a OneNote-like window: folders, pages, Markdown editor, search, and an Inbox of quick notes.

Notes are plain Markdown files on disk, readable without the app.

## 2. Non-goals (v1)

Sync, images/attachments, tags, rich-text toolbar, collaboration, mobile, SQLite storage (TODO), Wayland portal shortcuts (TODO).

## 3. Stack

- **Tauri 2** (Rust backend, system webview).
- **Frontend:** SvelteKit (static adapter, SPA) + TypeScript + Svelte 5.
- **Editor:** CodeMirror 6 with Markdown language + live styling.
- **Icons:** Lucide (ISC license).
- **Plugins:** `global-shortcut`, `single-instance`, `autostart`.
- **CI:** GitHub Actions + `tauri-action` → `.deb`, `.AppImage`, `.rpm`, `.msi`/`.exe`, `.dmg`.
- **License:** MIT.

## 4. Data model

Notes root (default `<Documents>/Flashjot`, configurable):

```
Flashjot/
├── Inbox/                      ← quick notes, one file each
│   └── 2026-10-19-143205.md
├── Ideas/
│   └── Robot arm.md
└── Work/
    └── Meeting.md
```

- One quick note = one file in `Inbox/` named `YYYY-MM-DD-HHMMSS.md` (suffix `-2`, `-3` on collision). One file per note avoids edit conflicts between the quick box and the notebook editor and makes "move" a rename.
- Pages: any `*.md` under the root; folders = directories (one level is the common case, nesting allowed).
- Every write is atomic: write `name.md.tmp` → `fsync` → rename over target.
- Page title = file name without `.md`. Renaming a page renames the file.
- Path safety: every path coming from the UI is resolved under the root; `..`, absolute paths and symlink escapes are rejected.

Settings: `<app config dir>/settings.json`

```json
{ "notesDir": null, "quickShortcut": "CommandOrControl+Alt+N",
  "notebookShortcut": "CommandOrControl+Alt+D", "language": "auto",
  "launchAtLogin": true }
```

## 5. UX

### Quick capture (`Ctrl/Cmd+Alt+N`)
- Frameless, always-on-top, skip-taskbar window, ~560×150, centred horizontally in the upper third of the monitor under the mouse.
- Caret already in the text area; window is pre-created and hidden so showing is instant.
- `Enter` saves, `Shift+Enter` new line, `Esc` / focus loss hides **and keeps the draft** (restored next time). Empty text never saves.
- After save: "✓ Saved" for ~300 ms, then hide and clear.
- `Ctrl/Cmd+Alt+D` from anywhere opens the notebook.

### Notebook (`Ctrl/Cmd+Alt+D`)
- Sidebar: search (`Ctrl+K`), Inbox with count, folder tree with pages, "+ New page" (`Ctrl+N`). `Ctrl+B` toggles sidebar.
- Inbox view: quick notes as cards (newest first) with actions: open, move to folder (`Ctrl+M`), delete (`Del`, with undo toast).
- Editor: CodeMirror Markdown; headings larger/bold, `**bold**`, `*italic*`, `` `code` ``, clickable `- [ ]` checkboxes. Autosave (debounced 500 ms), subtle "✓ saved" indicator. No save button.
- Light/dark follows OS. Fully keyboard-operable.
- Closing the notebook hides it; the app keeps running in the tray.

### Tray
Menu: Quick note · Notebook · Settings · Quit.

### Settings (in notebook)
Shortcuts (record a key combo), notes folder, language (auto/English/Türkçe), launch at login.

### i18n
English + Turkish dictionaries; `auto` picks from OS locale.

## 6. Architecture

```
global shortcut / tray / CLI arg ──► Rust core ──► show window(quick|notebook)
             frontend ──invoke──► Rust commands ──► store (filesystem)
             Rust ──event "notes-changed"──► notebook refreshes
```

Rust modules (`src-tauri/src/`):

| Module | Responsibility | Depends on |
|---|---|---|
| `store.rs` | Notes on disk: list tree, read, write (atomic), create/rename/delete/move, add inbox note, search. **No Tauri imports**; unit-tested with temp dirs. | std, `chrono` |
| `settings.rs` | Load/save settings JSON with defaults. | serde |
| `windows.rs` | Create/show/hide/position quick + notebook windows. | tauri |
| `shortcuts.rs` | Register/re-register global shortcuts from settings. | global-shortcut plugin |
| `tray.rs` | Tray icon + menu. | tauri |
| `commands.rs` | `#[tauri::command]` wrappers around store/settings. | store, settings |
| `lib.rs` | Wiring, plugins, single-instance handling. | all |

Frontend (`src/`):

| Path | Responsibility |
|---|---|
| `routes/quick/+page.svelte` | Quick capture window |
| `routes/notebook/+page.svelte` | Notebook shell (sidebar + content) |
| `lib/api.ts` | Typed wrappers for `invoke` |
| `lib/i18n.ts` | Dictionaries + `t()` |
| `lib/editor/` | CodeMirror setup, markdown styling, checkbox widget |
| `lib/components/` | Sidebar, InboxList, Settings, Toast |

### Wayland / no-global-shortcut fallback
`flashjot --quick` and `flashjot --notebook` forward to the running instance via `single-instance`. README documents binding these in the desktop's keyboard settings.

## 7. Error handling

- Store errors return a typed error string to the UI; the UI shows a toast and **keeps the text** (quick box never clears on failed save).
- Shortcut registration failure (taken by another app) → notification + settings page shows the conflict.
- Missing notes dir → created on startup.

## 8. Testing

- `cargo test` for `store.rs` and `settings.rs` (atomic write, inbox naming/collisions, path-escape rejection, move/rename, search).
- `svelte-check` for types.
- Manual checklist for windows/shortcuts per OS (in `docs/manual-test.md`).
- CI runs tests + builds on all three OSes.

## 9. TODO (README roadmap)

- SQLite storage backend (optional, behind the `store` interface)
- Wayland global shortcuts via XDG GlobalShortcuts portal
- Watch notes folder for external edits
- Tags / `#hashtags`, images, sync, more languages
