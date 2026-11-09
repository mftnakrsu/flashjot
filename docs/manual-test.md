# Manual test checklist

Run this on each OS before a release. Use a scratch notes folder (Settings → Notes folder) so real notes are safe.

## Quick box
- [ ] From another app, `Ctrl/⌘+Alt+N` opens the box on the monitor under the mouse, **with the caret in the text field** (you can type right away).
- [ ] Type a line, press `Enter`: the red rule turns green, "Saved to Inbox" shows, the box closes, and a new file appears in `Inbox/`.
- [ ] `Shift+Enter` adds a new line and does not save.
- [ ] Type something, press `Esc`, reopen: the draft is still there. Do the same after clicking another window.
- [ ] Press the shortcut while the box is focused: it hides.
- [ ] Empty text + `Enter`: nothing is saved.
- [ ] Type, then `Ctrl/⌘+Z` removes it and `Ctrl/⌘+Shift+Z` brings it back. Same in a page title.
- [ ] `[] süt` + Enter shows "Added to Tasks" / "Görevlere eklendi"; the Tasks page has `- [ ] süt`.
- [ ] `[] a`, Shift+Enter, `b` adds two tasks; plain text still goes to the Inbox.
- [ ] Only `[]` + Enter saves nothing and keeps the box open.
- [ ] Right after Enter, typing or pressing Enter again changes nothing (#27); the next Ctrl+Alt+N opens an empty box.

## Notebook
- [ ] `Ctrl/⌘+Alt+D` opens and focuses the notebook. Closing the window hides it, and the app stays in the tray.
- [ ] A new quick note appears in the Inbox right away and the count goes up.
- [ ] Inbox: `↓`/`↑` move between cards, `M` opens "Move to…", typing filters folders, and `Enter` moves the note. The note gets a title from its first line.
- [ ] `Del` deletes, and **Undo** in the toast brings the note back.
- [ ] `Ctrl+N` creates "Untitled" next to the open page with the title selected. Type a title, press `Enter`, and the file is renamed and the caret moves to the body.
- [ ] Type in page A, switch to page B, switch back: both files on disk have the right content (no cross-writes).
- [ ] Clicking a `- [ ]` checkbox toggles `[x]` in the file.
- [ ] `Ctrl+K` search finds text in the body and the title.
- [ ] "Open tasks" shows the count; lists tasks from several pages, Tasks page first; code-block tasks are not listed.
- [ ] Ticking marks `[x]` in the file and strikes the row through; ticking again restores `[ ]`.
- [ ] Editing the task line elsewhere, then ticking it, shows "This task changed" and reloads the list.
- [ ] Rename a quick note to `Zebra`: it doesn't jump to the top of the Inbox (#17).
- [ ] A page named `CON` or `nul.md` is refused with a clear message, not a raw error (#16).
- [ ] Light and dark system themes both look right.

## Settings
- [ ] Record a new quick shortcut, save it, and check that the old one stops working and the new one works.
- [ ] Switch the language to Türkçe and back. Both windows and the tray menu update (#13).
- [ ] Change the notes folder: the sidebar shows the new folder's contents.
- [ ] Trash: delete two notes, open Settings: "2 deleted notes". **Empty trash** asks once, empties on the second click, and the button is then disabled (#15).
- [ ] A note in `.trash` named with a stamp older than 30 days is gone after restarting the app (#15).
- [ ] "Start when I log in" (release build only): log out and in, and the app is in the tray without opening windows.

## Linux extras
- [ ] Tray icon is visible on GNOME (with the AppIndicator extension, which Ubuntu ships), KDE and XFCE.
- [ ] Wayland: `flashjot --quick` bound to a desktop shortcut opens the box.
