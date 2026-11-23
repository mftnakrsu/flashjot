//! Where Flashjot keeps its settings and notes. The app and flashjot-mcp both call these,
//! so they always pick the same folder.

use crate::settings::Settings;
use crate::store::Store;
use std::path::PathBuf;

/// The app's identifier, `identifier` in `src-tauri/tauri.conf.json`.
pub const IDENTIFIER: &str = "io.github.mftnakrsu.flashjot";

/// The settings file: `<config dir>/<IDENTIFIER>/settings.json`, the same folder Tauri's
/// `app_config_dir()` gives the app (`~/.config/…` on Linux, `~/Library/Application Support/…`
/// on macOS, `%APPDATA%\…` on Windows). `None` when the system has no config folder.
pub fn settings_path() -> Option<PathBuf> {
    dirs::config_dir().map(|dir| dir.join(IDENTIFIER).join("settings.json"))
}

/// The notes folder from settings, or `<Documents>/Flashjot` when none is set.
pub fn notes_root(s: &Settings) -> PathBuf {
    match s.notes_dir.as_deref().map(str::trim) {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => default_root(),
    }
}

pub fn default_root() -> PathBuf {
    dirs::document_dir().or_else(dirs::home_dir).unwrap_or_else(|| PathBuf::from(".")).join("Flashjot")
}

/// The saved notes folder, or `fallback` if it can't be used (e.g. a removed drive).
/// The setting is kept, so the folder is used again once it is back.
pub fn open_store(root: PathBuf, fallback: PathBuf) -> Store {
    let store = Store::new(root);
    let Err(e) = store.ensure() else { return store };
    eprintln!("flashjot: notes folder {} unusable ({e}), using {}", store.root().display(), fallback.display());
    let store = Store::new(fallback);
    if let Err(e) = store.ensure() {
        eprintln!("flashjot: notes folder {}: {e}", store.root().display());
    }
    store
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    /// A path below a regular file can never be created.
    fn unusable(d: &Path) -> PathBuf {
        fs::write(d.join("file"), "").unwrap();
        d.join("file/notes")
    }

    #[test]
    fn identifier_matches_tauri_conf() {
        let conf: serde_json::Value =
            serde_json::from_str(include_str!("../../../src-tauri/tauri.conf.json")).unwrap();
        assert_eq!(conf["identifier"], IDENTIFIER);
    }

    #[test]
    fn settings_path_is_in_the_app_config_folder() {
        let p = settings_path().expect("config dir");
        assert!(p.ends_with(Path::new(IDENTIFIER).join("settings.json")));
    }

    #[test]
    fn notes_root_uses_setting_or_default() {
        let set = Settings { notes_dir: Some(" /tmp/n ".into()), ..Settings::default() };
        assert_eq!(notes_root(&set), PathBuf::from("/tmp/n"));
        let blank = Settings { notes_dir: Some("  ".into()), ..Settings::default() };
        assert_eq!(notes_root(&blank), default_root());
        assert!(default_root().ends_with("Flashjot"));
    }

    #[test]
    fn startup_falls_back_when_saved_notes_dir_is_unusable() {
        let d = tempfile::tempdir().unwrap();
        let fallback = d.path().join("default");
        let store = open_store(unusable(d.path()), fallback.clone());
        assert_eq!(store.root(), fallback);
        assert!(fallback.join("Inbox").is_dir());
    }
}
