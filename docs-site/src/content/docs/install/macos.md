---
title: macOS
description: Install Flashjot on a Mac with Apple Silicon or an Intel processor.
---

## Install

1. Download the disk image for your Mac from the
   [latest release](https://github.com/mftnakrsu/flashjot/releases/latest):
   - `Flashjot_x.y.z_aarch64.dmg` for Apple Silicon (M1 and newer)
   - `Flashjot_x.y.z_x64.dmg` for Intel Macs

   Not sure which you have? Apple menu → **About This Mac**: “Chip” means Apple Silicon,
   “Processor” means Intel.
2. Open the disk image and drag **Flashjot** into **Applications**.

## First start

Flashjot isn't notarized by Apple yet, so macOS blocks the first start:

1. Open Flashjot from Applications. macOS says it can't check the app; select **Done**.
2. Open System Settings → **Privacy & Security**, scroll down to the message about Flashjot and
   select **Open Anyway**, then confirm.

After that it opens normally. If you prefer the Terminal, this does the same:

```bash
xattr -dr com.apple.quarantine /Applications/Flashjot.app
```

Flashjot lives in the menu bar rather than the Dock. Press <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>N</kbd>
to try the [quick box](/guide/quick-capture/), and <kbd>⌘</kbd>+<kbd>⌥</kbd>+<kbd>D</kbd> for the
notebook.

## Uninstall

Quit Flashjot from its menu bar icon and move it from Applications to the Bin. Your notes in
`Documents/Flashjot` stay where they are.
