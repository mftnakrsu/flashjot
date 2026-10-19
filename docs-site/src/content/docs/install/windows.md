---
title: Windows
description: Install Flashjot on Windows 10 or 11.
---

## Install

1. Download `Flashjot_x.y.z_x64-setup.exe` from the
   [latest release](https://github.com/mftnakrsu/flashjot/releases/latest). If your organisation
   deploys software with MSI packages, use `Flashjot_x.y.z_x64_en-US.msi` instead.
2. Run it. Flashjot isn't signed with a code-signing certificate yet, so Windows SmartScreen may say
   it protected your PC. Select **More info**, then **Run anyway**.
3. Follow the installer. It needs Microsoft Edge WebView2, which comes with Windows 10 and 11; on
   the rare system without it, the installer downloads it.

Start **Flashjot** from the Start menu. The notebook opens and an icon appears in the notification
area. From now on Flashjot starts there when you sign in. Press
<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> to try the [quick box](/guide/quick-capture/).

:::tip[Keyboard layouts with AltGr]
On many layouts, Windows treats <kbd>Ctrl</kbd>+<kbd>Alt</kbd> as <kbd>AltGr</kbd>. If
<kbd>AltGr</kbd>+<kbd>N</kbd> or <kbd>AltGr</kbd>+<kbd>D</kbd> types a character you need, record a
different shortcut in [Settings](/guide/settings/#shortcuts), for example
<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Space</kbd>.
:::

## Uninstall

Settings → Apps → Installed apps → Flashjot → Uninstall. Your notes in `Documents\Flashjot` stay
where they are.
