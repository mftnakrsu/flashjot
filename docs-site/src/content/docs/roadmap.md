---
title: Roadmap
description: What is planned for Flashjot next, and where help is welcome.
---

Flashjot 0.1 covers the core loop: capture, sort, write, search. These are the next steps. If you
want to work on one, open an issue on [GitHub](https://github.com/mftnakrsu/flashjot/issues) first so
we can agree on the approach.

## Planned

- **Optional SQLite storage.** A second backend behind the same `store` interface, for very large
  notebooks and faster search. Markdown files stay the default.
- **Wayland global shortcuts** through the XDG GlobalShortcuts portal, so Wayland users don't need
  custom desktop shortcuts.
- **Watch the notes folder** and reload pages that other apps change.
- **Tags** with `#hashtags`, and filtering by tag.
- **Images and attachments** pasted into pages.
- **Signed and notarized builds** for Windows and macOS, so the first start doesn't need a warning
  click.

## Later

- Built-in sync between computers. Until then, put the notes folder in a synced folder; see
  [Backups and sync](/guide/your-notes/#backups-and-sync).
- More languages. See [Add a language](/development/contributing/#add-a-language).
