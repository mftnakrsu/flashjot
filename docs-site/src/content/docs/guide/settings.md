---
title: Settings
description: Change the global shortcuts, the notes folder, the language and whether Flashjot starts when you log in.
---

Open Settings with the gear icon at the bottom of the notebook sidebar, with
<kbd>Ctrl</kbd>+<kbd>,</kbd>, or from the tray menu. Changes apply when you select **Save**.

## Shortcuts

Click the shortcut you want to change, then press the new combination. It needs at least one of
<kbd>Ctrl</kbd>, <kbd>Alt</kbd> or <kbd>⌘</kbd> together with a letter, a number, a function key
or a punctuation key. <kbd>Esc</kbd> cancels.

When you save, Flashjot releases the old shortcuts and registers the new ones. If another app
already owns a combination, the settings page lists it under **Some settings could not be
applied** so you can pick another one.

## Notes folder

Leave the field empty to use the default, `Documents/Flashjot` in your home folder. Type another
path to keep your notes somewhere else, for example a folder that Syncthing, Dropbox or OneDrive
syncs. **Show in file manager** opens the current folder.

Flashjot doesn't move your existing notes when you change the folder. Copy them over yourself if
you want them in the new place.

If the folder can't be created, Flashjot says so and doesn't save the settings. If the folder can't
be used when Flashjot starts (for example a drive that isn't plugged in), it uses the default
folder until the folder is back.

## Language

**Automatic** follows your system language. English and Türkçe are available; to add another
language, see [Contributing](/development/contributing/#add-a-language).

## Start Flashjot when I log in

On by default, so the shortcuts work right after you log in. Flashjot starts in the tray without
opening a window.

## Where settings are stored

Settings are a small JSON file, `settings.json`, in the app's config folder:

| System | Folder |
|---|---|
| Linux | `~/.config/io.github.mftnakrsu.flashjot/` |
| Windows | `%APPDATA%\io.github.mftnakrsu.flashjot\` |
| macOS | `~/Library/Application Support/io.github.mftnakrsu.flashjot/` |

If the file is damaged, Flashjot starts with the defaults and keeps the old file as
`settings.json.bak`.
