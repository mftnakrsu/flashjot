---
title: Build from source
description: Set up the toolchain, run Flashjot in development mode, run the checks and build installers.
---

## Requirements

- [Rust](https://rustup.rs) 1.90 or newer
- Node.js 22 or newer
- The [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your system. On Debian,
  Ubuntu or Pardus:

  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

## Run it

```bash
git clone https://github.com/mftnakrsu/flashjot.git
cd flashjot
npm install
npm run tauri dev
```

`tauri dev` starts the Vite dev server and the app. Changes to the Svelte code reload instantly;
changes to Rust rebuild and restart the app.

:::caution
A development build uses the same notes folder and settings as an installed Flashjot. Point the
notes folder at a scratch folder in Settings while you experiment. Development builds never touch
the “start when I log in” setting.
:::

## Checks

```bash
npm test          # Rust unit tests: note store and settings (cargo test)
npm run check     # Svelte and TypeScript type checks
cd src-tauri && cargo clippy --all-targets
```

Continuous integration runs the same checks on Ubuntu 22.04, Windows and macOS for every push and
pull request.

## Build installers

```bash
npm run tauri build
```

The installers for your system land in `src-tauri/target/release/bundle/`: `.deb`, `.rpm` and
`.AppImage` on Linux, `.msi` and `.exe` on Windows, `.dmg` on macOS.

## Releases

Pushing a tag such as `v0.2.0` runs the release workflow, which builds every installer on GitHub
Actions and attaches them to a draft release. Linux builds run on Ubuntu 22.04 on purpose: a
binary only runs on systems with the same or a newer glibc, and 22.04's is old enough for Debian 12
and Pardus 23.
