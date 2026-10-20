---
title: Quick capture
description: Open the quick box with a global shortcut, write a thought, save it to the Inbox and get back to work.
---

The quick box is the part of Flashjot you use most. It is built for one thing: getting a thought
out of your head in a few seconds without leaving what you are doing.

<img
  class="shot"
  src="/screenshots/quick-en.png"
  alt="The quick box over the desktop: a white card with the Flashjot title, a red rule and a line of text, with the keys Enter, Shift+Enter and Esc listed at the bottom"
  width="1600"
  height="900"
  loading="lazy"
/>

## Capture a thought

1. Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> (<kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>N</kbd> on
   macOS) from any app. The box opens in the upper third of the monitor your mouse is on, and the
   cursor is already in the text field.
2. Type. <kbd>Shift</kbd>+<kbd>Enter</kbd> starts a new line if the thought needs more than one.
3. Press <kbd>Enter</kbd>. The red line turns green, **Saved to Inbox** shows for a moment, and
   the box closes.

The note is now a file in the `Inbox` folder of your notes, named after the time you saved it,
for example `Inbox/2026-10-19-143205.md`. It shows up in the notebook's
[Inbox](/guide/notebook/#the-inbox) straight away.

## Tasks

Start the text with `[]` (or `[ ]`) and press Enter to add tasks instead of a note. Every line
becomes one task, so `[] milk`, then Shift+Enter, then `bread` adds two. Tasks go to the
**Tasks** page at the top of your notes folder as ordinary Markdown checkboxes (`- [ ] milk`).
The page is created with the first task. If you rename or move it, Flashjot starts a new one.

## Close without saving

Press <kbd>Esc</kbd>, press the shortcut again, or click outside the box. It closes, but **your
text stays**: the next time you open the box, the draft is still there, even after a restart.
To throw a draft away, select it and delete it.

An empty box never creates a note.

## If saving fails

If the note can't be written, for example because the notes folder is on a disconnected drive,
the box stays open, shows **Could not save. Your text is still here.** and keeps your text. Fix the
folder in [Settings](/guide/settings/#notes-folder) and press <kbd>Enter</kbd> again.

## Jump to the notebook

The **Notebook** button at the top right of the box, or <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd>,
opens the notebook.

## Shortcut doesn't work?

- **Another app uses the same keys.** Pick another combination in
  [Settings](/guide/settings/#shortcuts). Flashjot tells you there if a shortcut could not be
  registered.
- **Linux on Wayland.** Wayland doesn't let apps register global shortcuts yet. Bind the command
  `flashjot --quick` to a key in your desktop's keyboard settings; see
  [Linux](/install/linux/#wayland).
- **Flashjot isn't running.** Start it once from the app menu. It keeps running in the tray, and
  with **Start Flashjot when I log in** on, it starts by itself.
