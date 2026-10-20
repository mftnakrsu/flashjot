# Quick tasks (v0.2.0): design

Date: 2026-10-20. Issues: #18 (quick tasks), #19 (open tasks view), #27 (quick box typing while saved).

## Goal

Let people use Flashjot as a light to-do tool without leaving plain Markdown: capture a task from
the quick box, keep tasks in one page, and see every unchecked task across all notes in one view.

Out of scope: due dates, reminders, priorities, recurrence, editing task text inside the open
tasks view, reordering.

## 1. Capturing a task in the quick box

- The trigger is a prefix: if the trimmed text starts with `[]` or `[ ]` (followed by a space or the
  end of the line), pressing Enter saves tasks instead of an Inbox note.
- Every non-empty line becomes one task. From each line, strip leading whitespace and then one
  optional prefix: `- [ ] `, `[ ] `, `[] `, or `- `. Lines that are empty after that are skipped.
  So `[] milk\nbread` gives two tasks, "milk" and "bread".
- Text without the prefix is saved as an Inbox note exactly as today.
- Confirmation text: EN "Added to Tasks", TR "Görevlere eklendi" (instead of "Saved to Inbox").
- The hint row under the box gains one hint: `[]` + EN "task" / TR "görev".
- Parsing lives in Rust (`store.rs`, pure function `parse_tasks(text) -> Option<Vec<String>>`,
  `None` when the text has no prefix) so it is unit-tested. The quick box keeps calling one command
  (`add_quick_note`); the command decides between note and tasks and returns which one it did, so
  the box can show the right confirmation.

## 2. The Tasks page

- One page at the root of the notes folder. Its file name is chosen the first time a task is
  added: `Tasks.md` when the UI language is English, `Görevler.md` when it is Turkish. The frontend
  passes the localized title with the command; the backend never guesses the language.
- The chosen relative path is stored in settings as `tasksPage` (`Option<String>`, default `None`),
  so switching the UI language later never creates a second file.
- When adding: if `tasksPage` is set and the file exists, append to it. Otherwise use
  `<root>/<localized title>.md`: if a file with that name already exists (the user made one),
  append to it; if not, create it. Then store its path in `tasksPage`.
  If the user renamed or moved the page, the stored path no longer exists, so a new default page is
  created; this is acceptable for v0.2 and documented.
- Each task is appended as `- [ ] <text>\n`. If the file doesn't end with a newline, one is added
  first. Writes use `atomic_write`. The command emits `notes-changed`.
- If the Tasks page is open in the editor, the existing conflict check (#3) makes the editor reload
  it, so the new task appears and nothing typed is silently overwritten.

## 3. The open tasks view

- Sidebar: a new row under Inbox, EN "Open tasks" / TR "Açık görevler", with the count of open
  tasks as a badge (hidden when 0). It is a normal button, so it is reachable with Tab and Enter.
  New `View` kind: `{ kind: "tasks" }`.
- Content: every unchecked task line in every `.md` file (excluding `.trash` and hidden folders),
  grouped by page. Group order: the Tasks page first, then other pages by modification time,
  newest first. Within a page, file order.
- A task line is a line matching `^\s*[-*+] \[ \] (.+)$`. Lines inside fenced code blocks
  (``` or ~~~) are ignored. Checked lines (`[x]`, `[X]`) are not listed.
- Each row: a checkbox and the task text (shown as plain text). Clicking the text opens the page.
  Clicking the page title in the group header opens the page.
- Ticking: the checkbox calls a command that sets that line to `[x]` (or back to `[ ]` when
  unticked). The row stays in place, struck through, until the view is left or refreshed, so an
  accidental tick can be undone with one more click.
- The command identifies the task by `path`, 0-based `line` index and the expected line `text`.
  If the line at that index no longer matches the expected text (the file changed), it refuses
  with a conflict error; the UI shows a toast (EN "This task changed. Reloaded the list." /
  TR "Bu görev değişmiş. Liste yenilendi.") and refreshes the view.
- Backend: `Store::open_tasks() -> Vec<TaskGroup { path, title, tasks: Vec<Task { line, text }> }>`
  and `Store::set_task(path, line, expected_text, done) -> Result<(), StoreError>` (uses
  `StoreError::Conflict`). Both commands are `#[tauri::command(async)]` because `open_tasks`
  scans every file, like search. `set_task` emits `notes-changed`.
- The count badge comes from the same `open_tasks` call, made in `Notebook.refresh()` next to the
  tree and the Inbox.

## 4. #27: quick box keeps accepting input while "Saved"

Make the text area `readonly` while `status` is `"saving"` or `"saved"`, return early in
`onKeydown` and `save()` when `status === "saved"`, and make sure the next `quick-shown` gives an
empty, editable, focused box. Applies to task saves as well.

## 5. Errors

- Empty task list after parsing (e.g. only `[]`): treated like empty text today (nothing saved, no
  error shown).
- Write failures reuse the existing error paths (quick box: "Could not save. Your text is still
  here."; notebook: error toast).

## 6. Testing

Rust unit tests in `store.rs` (and `commands.rs` where settings are involved):

- `parse_tasks`: no prefix → `None`; `[]`, `[ ]`, `- [ ]` prefixes; multi-line with mixed prefixes;
  blank lines skipped; only `[]` → empty list; Turkish text unchanged.
- Adding tasks: creates `Tasks.md`/`Görevler.md` with the given title; appends to an existing file;
  adds a missing trailing newline; reuses a user-made file with the same name; stored path is
  reused after a language switch; a missing stored path falls back to the default.
- `open_tasks`: nested list items, `*`/`+` bullets, checked items excluded, fenced code ignored,
  `.trash` excluded, Tasks page first.
- `set_task`: ticks and unticks the right line; conflict when the line changed; out-of-range line
  is a conflict, not a panic.

Frontend: `npm run check` clean; `docs/manual-test.md` gains steps for quick tasks, the open tasks
view, ticking/unticking, and #27.

## 7. Docs and release

- Docs site (EN + TR): a "Tasks" section in the quick note and notebook guides; keyboard hint.
- README feature list and roadmap: tasks done; CHANGELOG 0.2.0.
- Version 0.2.0. One PR closing #18, #19 and #27.
