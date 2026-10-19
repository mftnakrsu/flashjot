---
title: Architecture
description: How Flashjot is put together, the Rust core, the two windows and the Svelte frontend.
---

Flashjot is a [Tauri 2](https://v2.tauri.app) app. A small Rust core owns the files, the windows,
the global shortcuts and the tray. The interface is a SvelteKit single-page app that runs in the
system web view: WebKitGTK on Linux, WebView2 on Windows and WKWebView on macOS.

```text
global shortcut ┐
tray menu       ├──▶ Rust core ──▶ show the quick box or the notebook
--quick flag    ┘        ▲
                         │ invoke (commands)        event "notes-changed"
Svelte UI ───────────────┘ ◀──────────────────────────────────────────
                         │
                         ▼
                 store.rs ──▶ Markdown files on disk
```

## Rust core (`src-tauri/src/`)

| File | Responsibility |
|---|---|
| `store.rs` | Everything on disk: list folders and pages, read, write, create, rename, move, trash and restore, search. Validates every path coming from the UI and writes atomically. It has no Tauri dependency, so it is unit-tested with temporary folders. |
| `settings.rs` | Loads and saves `settings.json`, filling in defaults and keeping a damaged file as `.bak`. |
| `commands.rs` | The commands the UI calls, as thin wrappers around `store` and `settings`. After every change it emits `notes-changed` so all windows refresh. |
| `windows.rs` | Creates the quick box and the notebook hidden at startup, so showing them is instant. Places the quick box on the monitor under the mouse. |
| `shortcuts.rs` | Registers the two global shortcuts from settings and re-registers them when they change. |
| `tray.rs` | The tray icon and its menu. |
| `lib.rs` | Wires it together: plugins, the `--quick` / `--notebook` / `--hidden` flags, start at login. |

### Two windows, created once

Both windows are created at startup and hidden. A shortcut only has to show one, which is why the
quick box appears without a delay. Closing the notebook hides it instead of destroying it.

### One instance

The single-instance plugin makes a second `flashjot --quick` hand its arguments to the running app
and exit. That is how the Wayland custom shortcuts reuse the running app.

### Focus on GNOME

GNOME's window manager ignores a request to focus a window when the request carries no fresh
timestamp, which is what showing a window from a background hotkey looks like. On Linux, Flashjot
presents its windows with the current X server time, the same fix polkit-gnome uses, so the quick
box gets the keyboard right away. As a safety net, the quick box only hides on focus loss after it
really had focus; on desktops that refuse focus it stays visible until you click it.

## Frontend (`src/`)

| Path | Responsibility |
|---|---|
| `routes/quick/` | The quick box. |
| `routes/notebook/` | The notebook shell and its keyboard shortcuts. |
| `lib/components/` | Sidebar, Inbox, page view, dialogs, settings and the toast. |
| `lib/editor/` | CodeMirror 6 setup: Markdown with live styling and clickable task checkboxes. |
| `lib/notebook.svelte.ts` | The notebook's state and actions, shared by its components. |
| `lib/api.ts` | Typed wrappers for the Rust commands. |
| `lib/i18n.svelte.ts` | The English and Turkish interface text. |
| `lib/theme.css` | Colour and type tokens for light and dark mode. |

Each route is prerendered to its own HTML file (`quick.html`, `notebook.html`), and each window
loads its own.

## Data model

See [Your notes](/guide/your-notes/) for the folder layout. Quick notes are one file each, named
after the second they were saved, so the quick box and the notebook never write to the same file.
Moving a note out of the Inbox renames it after its first line.
