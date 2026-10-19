---
title: Your notes
description: How Flashjot stores notes as plain Markdown files, where they are, and how to back them up or sync them.
---

Flashjot doesn't have a database. Every note is a Markdown file in a normal folder, so you can
read, edit, search, back up and sync your notes with any tool, and they stay readable without
Flashjot.

## Where they are

By default, in `Documents/Flashjot` in your home folder. You can choose another folder in
[Settings](/guide/settings/#notes-folder).

```text
Documents/Flashjot/
├── Inbox/                         quick notes, one file each
│   └── 2026-10-19-143205.md
├── Ideas/                         a folder in the notebook
│   ├── Robot arm.md               a page; the file name is the title
│   └── Reading list.md
├── Work/
│   └── Weekly sync.md
├── Loose page.md                  a page with no folder
└── .trash/                        deleted notes
```

- A **page** is a `.md` file. Its title is the file name without `.md`.
- A **folder** in the sidebar is a folder on disk. Folders inside folders work too.
- Files that don't end in `.md`, and folders whose name starts with a dot, are ignored.

## Editing outside Flashjot

You can edit the files with any editor, or point Obsidian at the same folder. The sidebar reloads
the folder when the notebook starts and whenever you add, rename, move or delete a note in
Flashjot, so files created elsewhere show up then. A page that is open in Flashjot while you edit
it elsewhere doesn't reload by itself yet; switch to another page and back. Watching the folder for
changes is on the [roadmap](/roadmap/).

## Safe writes

Flashjot writes each save to a temporary file next to the note, flushes it to disk, then swaps it in
place of the old file. A crash or a power cut leaves either the old version or the new one, never a
half-written file.

## Deleted notes

Deleting moves the file into `.trash/` with the time added to its name. **Undo** right after
deleting moves it back. Flashjot never empties the trash; delete the files in `.trash/` yourself
when you are sure.

## Backups and sync

Because notes are plain files, any backup tool works. A few common setups:

- **Git:** run `git init` in the notes folder and commit now and then. Add `.trash/` to
  `.gitignore` if you don't want deleted notes in history.
- **Syncthing, Dropbox, OneDrive, iCloud Drive:** choose a synced folder as the notes folder in
  Settings.

Use one computer at a time on a synced folder. Flashjot doesn't merge edits made on two machines at
once.
