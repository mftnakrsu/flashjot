//! User settings stored as JSON in the app config folder.

use crate::store::atomic_write;
use serde::{Deserialize, Serialize};
use std::io;
use std::path::Path;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    /// None = `<Documents>/Flashjot`.
    pub notes_dir: Option<String>,
    pub quick_shortcut: String,
    pub notebook_shortcut: String,
    /// "auto", "en" or "tr".
    pub language: String,
    pub launch_at_login: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            notes_dir: None,
            quick_shortcut: "CommandOrControl+Alt+N".into(),
            notebook_shortcut: "CommandOrControl+Alt+D".into(),
            language: "auto".into(),
            launch_at_login: true,
        }
    }
}

/// Never fails: a missing file gives defaults, a corrupt one is kept as `.bak`.
pub fn load(path: &Path) -> Settings {
    let Ok(text) = std::fs::read_to_string(path) else {
        return Settings::default();
    };
    serde_json::from_str(&text).unwrap_or_else(|_| {
        let mut bak = path.as_os_str().to_owned();
        bak.push(".bak");
        let _ = std::fs::rename(path, bak);
        Settings::default()
    })
}

pub fn save(path: &Path, settings: &Settings) -> io::Result<()> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let json = serde_json::to_string_pretty(settings).map_err(io::Error::other)?;
    atomic_write(path, &json)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn missing_file_gives_defaults() {
        let d = tempfile::tempdir().unwrap();
        let s = load(&d.path().join("settings.json"));
        assert_eq!(s, Settings::default());
        assert_eq!(s.quick_shortcut, "CommandOrControl+Alt+N");
        assert_eq!(s.notebook_shortcut, "CommandOrControl+Alt+D");
        assert_eq!(s.language, "auto");
        assert!(s.launch_at_login);
        assert!(s.notes_dir.is_none());
    }

    #[test]
    fn partial_json_fills_defaults() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("settings.json");
        fs::write(&p, r#"{"language":"tr"}"#).unwrap();
        let s = load(&p);
        assert_eq!(s.language, "tr");
        assert_eq!(s.quick_shortcut, "CommandOrControl+Alt+N");
    }

    #[test]
    fn corrupt_file_is_backed_up() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("settings.json");
        fs::write(&p, "{ not json").unwrap();
        assert_eq!(load(&p), Settings::default());
        assert_eq!(fs::read_to_string(d.path().join("settings.json.bak")).unwrap(), "{ not json");
    }

    #[test]
    fn save_then_load_round_trips() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("nested/settings.json");
        let s = Settings { notes_dir: Some("/x".into()), launch_at_login: false, ..Settings::default() };
        save(&p, &s).unwrap();
        assert_eq!(load(&p), s);
        assert!(fs::read_to_string(&p).unwrap().contains("\"quickShortcut\""));
    }
}
