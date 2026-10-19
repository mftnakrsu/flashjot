# Contributing to Flashjot

Thanks for helping. A few things keep the project easy to work on.

## Principles

1. **Capture must stay instant.** Avoid adding work that runs when the quick box opens.
2. **Notes are the user's files.** Never change the on-disk format without a migration. Every write goes through `atomic_write`, and every path the UI sends is validated in `store.rs`.
3. **Keyboard first.** A new action needs a shortcut or must be reachable with Tab and Enter.

## Workflow

```sh
npm install
npm run tauri dev
npm test          # cargo test: store + settings
npm run check     # svelte-check
```

- Logic that touches the filesystem goes in `src-tauri/src/store.rs` and **must come with a unit test**. Write the test first.
- UI text goes in `src/lib/i18n.svelte.ts`, with every key in every language.
- Use the CSS tokens in `src/lib/theme.css` for colors so light and dark themes both work.
- Before a PR, run through [`docs/manual-test.md`](docs/manual-test.md) on your OS.

## Adding a language

Copy the `en` object in `src/lib/i18n.svelte.ts`, translate every value, add it to `dictionaries`, and add an `<option>` in `SettingsView.svelte`.

## Commit messages

Use the [Conventional Commits](https://www.conventionalcommits.org) style: `feat:`, `fix:`, `docs:`, `chore:`.
