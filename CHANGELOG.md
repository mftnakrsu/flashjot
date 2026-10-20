# Changelog

All notable changes to Flashjot are listed here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [0.2.0] - 2026-10-20

### Added

- Start a quick note with `[]` to add tasks to a Tasks page instead of the Inbox. Every line
  becomes one task. (#18)
- **Open tasks** in the notebook lists every unchecked task across your notes, grouped by page.
  Tick a task to mark it done in its file. (#19)

### Fixed

- The quick box ignores typing while a note is being saved, so nothing typed in that moment ends
  up in the next note or saves a second one. (#27)

## [0.1.1] - 2026-10-19

### Fixed

- Moving a page into the folder it is already in no longer renames it to "… 2". Changing only the
  case of a title (for example "idea" to "Idea") no longer adds " 2" on macOS and Windows. (#1)
- Search treats the Turkish I, İ, ı and i as the same letter, so "istanbul" finds "İstanbul" and
  "ılık" finds "ILIK". (#2)
- Flashjot no longer overwrites a page that another app changed while it was open. It tells you and
  loads the version on disk instead. (#3)
- A notes folder that can't be created is no longer saved in Settings. If the saved folder can't be
  used when Flashjot starts, it uses the default folder until the folder is back. (#4)
- Pressing Enter on a button inside an Inbox card runs that button instead of opening the note. (#5)
- The Inbox shows the latest text of notes you edited since you last opened it. (#6)
- The quick box no longer shows "What's on your mind?" next to "Saved to Inbox" right after saving.
  (#7)
- Inbox dates follow the app language even when settings load after the first view.

### Performance

- Search, the sidebar and the Inbox load in the background, so a large notes folder doesn't freeze
  the window, and search waits for a short pause in typing. (#8)
- The sidebar lists pages without reading every note. (#9)
- The notebook reloads once per change instead of twice, and settings reload only when they
  change. (#10)

## [0.1.0] - 2026-10-19

First release: a global quick-capture box, an Inbox, a Markdown notebook with folders and search,
English and Turkish.

[0.1.1]: https://github.com/mftnakrsu/flashjot/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mftnakrsu/flashjot/releases/tag/v0.1.0
