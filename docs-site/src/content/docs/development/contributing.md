---
title: Contributing
description: How to propose changes, the rules that keep Flashjot fast and safe, and how to add a language.
---

Issues and pull requests are welcome on [GitHub](https://github.com/mftnakrsu/flashjot): bug
reports, fixes, translations and features.

## Three rules

1. **Capture must stay instant.** Don't add work that runs when the quick box opens.
2. **Notes are the user's files.** Don't change the on-disk format without a migration. Every write
   goes through `atomic_write`, and every path the UI sends is validated in `store.rs`.
3. **Keyboard first.** A new action needs a shortcut, or must be reachable with <kbd>Tab</kbd> and
   <kbd>Enter</kbd>.

## Workflow

1. Set up the project as described in [Build from source](/development/building/).
2. Logic that touches the filesystem goes in `src-tauri/src/store.rs` and comes with a unit test.
   Write the test first.
3. Interface text goes in `src/lib/i18n.svelte.ts`, with every key in every language.
4. Use the colour tokens in `src/lib/theme.css` so light and dark mode both work.
5. Run `npm test`, `npm run check` and `cargo clippy`, and go through the
   [manual test checklist](https://github.com/mftnakrsu/flashjot/blob/main/docs/manual-test.md) on
   your system.
6. Open a pull request. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org):
   `feat:`, `fix:`, `docs:`, `chore:`.

## Add a language

1. In `src/lib/i18n.svelte.ts`, copy the `en` object, translate every value and add it to
   `dictionaries`.
2. Add an `<option>` for it in `src/lib/components/SettingsView.svelte`.
3. Make the automatic language detection in `detect()` recognise its language code.

TypeScript reports a missing key, so you can't forget one.
