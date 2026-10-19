---
title: Roadmap
description: What is planned for Flashjot next, and where help is welcome.
---

Flashjot 0.1 covers the core loop: capture, sort, write, search. These are the next steps. Each one
has an issue on GitHub; if you want to work on one, comment there first so we can agree on the
approach. Issues labelled
[`good first issue`](https://github.com/mftnakrsu/flashjot/labels/good%20first%20issue) are small and
self-contained.

## Next: v0.2

- **Quick tasks.** Capture a to-do from the quick box as a `- [ ]` task on a Tasks page; the
  trigger is still open for discussion ([#18](https://github.com/mftnakrsu/flashjot/issues/18)).
- **Open tasks view.** Every unchecked task across all notes in one list, ticked off in place
  ([#19](https://github.com/mftnakrsu/flashjot/issues/19)).

## Planned

- **Optional SQLite storage.** A second backend behind the same `store` interface, for very large
  notebooks and faster search. Markdown files stay the default
  ([#22](https://github.com/mftnakrsu/flashjot/issues/22)).
- **Wayland global shortcuts** through the XDG GlobalShortcuts portal, so Wayland users don't need
  custom desktop shortcuts ([#20](https://github.com/mftnakrsu/flashjot/issues/20)).
- **Watch the notes folder** and reload pages that other apps change
  ([#21](https://github.com/mftnakrsu/flashjot/issues/21)).
- **Tags** with `#hashtags`, and filtering by tag
  ([#23](https://github.com/mftnakrsu/flashjot/issues/23)).
- **Images and attachments** pasted into pages
  ([#24](https://github.com/mftnakrsu/flashjot/issues/24)).
- **Signed and notarized builds** for Windows and macOS, so the first start doesn't need a warning
  click.

## Later

- Built-in sync between computers. Until then, put the notes folder in a synced folder; see
  [Backups and sync](/guide/your-notes/#backups-and-sync)
  ([#25](https://github.com/mftnakrsu/flashjot/issues/25)).
- More languages. See [Add a language](/development/contributing/#add-a-language)
  ([#26](https://github.com/mftnakrsu/flashjot/issues/26)).
