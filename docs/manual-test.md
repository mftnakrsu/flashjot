# Manual test checklist

Run this on each OS before a release. Use a scratch notes folder (Settings → Notes folder) so real notes are safe.

## Quick box
- [ ] From another app, `Ctrl/⌘+Alt+N` opens the box on the monitor under the mouse, **with the caret in the text field** (you can type right away).
- [ ] Type a line, press `Enter`: the red rule turns green, "Saved to Inbox" shows, the box closes, and a new file appears in `Inbox/`.
- [ ] `Shift+Enter` adds a new line and does not save.
- [ ] Type something, press `Esc`, reopen: the draft is still there. Do the same after clicking another window.
- [ ] Press the shortcut while the box is focused: it hides.
- [ ] Empty text + `Enter`: nothing is saved.

## Notebook
- [ ] `Ctrl/⌘+Alt+D` opens and focuses the notebook. Closing the window hides it, and the app stays in the tray.
- [ ] A new quick note appears in the Inbox right away and the count goes up.
- [ ] Inbox: `↓`/`↑` move between cards, `M` opens "Move to…", typing filters folders, and `Enter` moves the note. The note gets a title from its first line.
- [ ] `Del` deletes, and **Undo** in the toast brings the note back.
- [ ] `Ctrl+N` creates "Untitled" next to the open page with the title selected. Type a title, press `Enter`, and the file is renamed and the caret moves to the body.
- [ ] Type in page A, switch to page B, switch back: both files on disk have the right content (no cross-writes).
- [ ] Clicking a `- [ ]` checkbox toggles `[x]` in the file.
- [ ] `Ctrl+K` search finds text in the body and the title.
- [ ] Light and dark system themes both look right.

## Settings
- [ ] Record a new quick shortcut, save it, and check that the old one stops working and the new one works.
- [ ] Switch the language to Türkçe and back. Both windows update.
- [ ] Change the notes folder: the sidebar shows the new folder's contents.
- [ ] "Start when I log in" (release build only): log out and in, and the app is in the tray without opening windows.

## Linux extras
- [ ] Tray icon is visible on GNOME (with the AppIndicator extension, which Ubuntu ships), KDE and XFCE.
- [ ] Wayland: `flashjot --quick` bound to a desktop shortcut opens the box.
