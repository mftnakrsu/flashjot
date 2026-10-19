---
title: Notebook
description: Sort quick notes from the Inbox into folders, write pages in Markdown and search everything.
---

The notebook is where your notes live once you have time for them. Open it with
<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> (<kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>D</kbd> on macOS), from
the tray menu, or by starting Flashjot from the app menu. Closing the window only hides it;
Flashjot keeps running in the tray.

<img
  class="shot"
  src="/screenshots/page-en.png"
  alt="The notebook with the folders Ideas and Work in the sidebar and the page Robot arm open, showing headings, checkboxes and a code block"
  width="2160"
  height="1350"
  loading="lazy"
/>

## The Inbox

Every note you save from the quick box lands in the **Inbox**, newest first. The red number in the
sidebar shows how many are waiting. Each note is a card with the time you wrote it.

<img
  class="shot"
  src="/screenshots/inbox-en.png"
  alt="The Inbox with three quick notes shown as cards, each with a red line along the top and a time"
  width="2160"
  height="1350"
  loading="lazy"
/>

Click a card, or move between cards with <kbd>↑</kbd> and <kbd>↓</kbd>, then:

| Key | What it does |
|---|---|
| <kbd>Enter</kbd> | Open the note in the editor |
| <kbd>M</kbd> | Move it to a folder |
| <kbd>Del</kbd> | Delete it (you can undo) |

The same actions appear as buttons when you hover over a card.

### Move a note into a folder

Press <kbd>M</kbd> or select **Move to…**. Start typing a folder name to filter the list, then
press <kbd>Enter</kbd> or click a folder. If no folder matches, **New folder…** creates it.
**No folder** puts the note at the top level.

<img
  class="shot"
  src="/screenshots/move-en.png"
  alt="The Move to dialog over the Inbox with “Ide” typed and the options Ideas, New folder “Ide” and No folder"
  width="2160"
  height="1350"
  loading="lazy"
/>

A quick note that leaves the Inbox gets a readable name from its first line. “Try a belt drive for
the shoulder joint” becomes `Ideas/Try a belt drive for the shoulder joint.md`, and Markdown marks
such as `#` or `- [ ]` at the start are dropped.

## Pages and folders

- **New page:** <kbd>Ctrl</kbd>+<kbd>N</kbd>, the **New page** button, or the page icon next to a
  folder. The page is created next to the one you have open, with the title selected so you can
  type over it. Press <kbd>Enter</kbd> to jump into the body.
- **Rename:** click the title at the top of the page and type. The file is renamed when you press
  <kbd>Enter</kbd> or click away.
- **New folder:** the folder icon at the bottom of the sidebar.
- **Move:** the folder icon at the top right of a page, or <kbd>Ctrl</kbd>+<kbd>M</kbd>.
- **Delete:** the bin icon on a page or next to it in the sidebar, or <kbd>Del</kbd> on a
  selected page. Deleted notes go to a `.trash` folder, and **Undo** in the message at the bottom
  brings them back.

## Writing

Pages are Markdown. You see the Markdown as you type it, and it is styled as you go:

| You type | You get |
|---|---|
| `# Heading`, `## Heading` | Larger, bold headings |
| `**bold**`, `*italic*` | Bold and italic text |
| `- item` | A list; <kbd>Enter</kbd> continues it |
| `- [ ] task` | A checkbox you can click; it becomes `- [x]` |
| `` `code` `` and ```` ``` ```` blocks | Code, with syntax colours for common languages |

There is no save button. Changes are written to disk half a second after you stop typing, when you
switch pages, and when the window loses focus. The top right of the page shows **Saved** or
**Saving…**.

## Search

Press <kbd>Ctrl</kbd>+<kbd>K</kbd> and type. Results replace the folder list while you type and
match both titles and text, including notes still in the Inbox. <kbd>Enter</kbd> opens the first
result, <kbd>↓</kbd> moves into the list, and <kbd>Esc</kbd> clears the search.

<img
  class="shot"
  src="/screenshots/search-en.png"
  alt="A search for “torque” in the sidebar with the result Robot arm and the matching line shown below it"
  width="2160"
  height="1350"
  loading="lazy"
/>

## Light and dark

The notebook follows your system's light or dark setting.

<img
  class="shot"
  src="/screenshots/page-dark-en.png"
  alt="The notebook in dark mode with the Robot arm page open"
  width="2160"
  height="1350"
  loading="lazy"
/>
