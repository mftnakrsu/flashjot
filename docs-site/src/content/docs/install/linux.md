---
title: Linux
description: Install Flashjot on Ubuntu, Debian, Pardus, Mint, Fedora or any distribution, and set up shortcuts on Wayland.
---

Download the file for your distribution from the
[latest release](https://github.com/mftnakrsu/flashjot/releases/latest). All builds are for 64-bit
Intel and AMD processors (`x86_64`, `amd64`).

## Ubuntu, Debian, Pardus, Linux Mint

Download `Flashjot_x.y.z_amd64.deb` and install it with:

```bash
sudo apt install ./Flashjot_*_amd64.deb
```

`apt` installs the few libraries Flashjot needs (WebKitGTK and the tray library) if they are
missing. It works on Ubuntu 22.04 and newer, Debian 12 and newer, Pardus 23 and newer, and Linux
Mint 21 and newer.

## Fedora, openSUSE

Download `Flashjot-x.y.z-1.x86_64.rpm` and install it with:

```bash
sudo dnf install ./Flashjot-*.x86_64.rpm      # Fedora
sudo zypper install ./Flashjot-*.x86_64.rpm   # openSUSE
```

## Any other distribution: AppImage

Download `Flashjot_x.y.z_amd64.AppImage`, make it executable and start it:

```bash
chmod +x Flashjot_*_amd64.AppImage
./Flashjot_*_amd64.AppImage
```

The AppImage carries its own libraries, which is why it is larger. If it doesn't start and
mentions FUSE, install `libfuse2` (`libfuse2t64` on Ubuntu 24.04).

## First start

Start **Flashjot** from your app menu. The notebook opens, and a Flashjot icon appears in the tray.
From now on Flashjot starts in the tray each time you log in (you can turn that off in
[Settings](/guide/settings/)). Press <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> to try the
[quick box](/guide/quick-capture/).

:::note[No tray icon on GNOME?]
GNOME hides tray icons unless the AppIndicator extension is on. Ubuntu ships it enabled. On other
distributions, install **AppIndicator and KStatusNotifierItem Support** from
[extensions.gnome.org](https://extensions.gnome.org/extension/615/appindicator-support/). Flashjot
works without the icon too; the shortcuts open its windows.
:::

## Wayland

On X11, KDE Plasma's X11 session, XFCE, Cinnamon and MATE, the global shortcuts work out of the
box. Wayland sessions, which are the default on recent GNOME and KDE, don't yet let apps register
global shortcuts themselves. Add the two shortcuts in your desktop's settings instead. They start
Flashjot if it isn't running and reuse it if it is, so the quick box still opens instantly.

| Name | Command | Suggested keys |
|---|---|---|
| Flashjot quick note | `flashjot --quick` | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>N</kbd> |
| Flashjot notebook | `flashjot --notebook` | <kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>D</kbd> |

- **GNOME:** Settings → Keyboard → View and Customize Shortcuts → Custom Shortcuts → **+**.
- **KDE Plasma:** System Settings → Keyboard → Shortcuts → Add New → Command or Script.

If you installed the AppImage, use its full path instead of `flashjot`, for example
`/home/you/Apps/Flashjot_0.1.0_amd64.AppImage --quick`.

To see which session you are in, run `echo $XDG_SESSION_TYPE`.

## Uninstall

```bash
sudo apt remove flashjot     # .deb
sudo dnf remove flashjot     # .rpm
```

For the AppImage, delete the file. Your notes in `Documents/Flashjot` stay where they are.
