//! Tauri commands called from the frontend. Thin wrappers around `store` and `settings`.

use crate::settings::{self, Settings};
use crate::store::{self, Hit, Note, NoteMeta, Store, TaskGroup, Tree};
use crate::{shortcuts, windows};
use std::io;
use std::path::{Path, PathBuf};
use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager, State};

pub struct AppState {
    pub store: Mutex<Store>,
    pub settings: Mutex<Settings>,
    pub settings_path: PathBuf,
}

impl AppState {
    pub fn new(settings_path: PathBuf) -> Self {
        let settings = settings::load(&settings_path);
        let store = open_store(notes_root(&settings), default_root());
        AppState { store: Mutex::new(store), settings: Mutex::new(settings), settings_path }
    }
}

pub fn notes_root(s: &Settings) -> PathBuf {
    match s.notes_dir.as_deref().map(str::trim) {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => default_root(),
    }
}

fn default_root() -> PathBuf {
    dirs::document_dir().or_else(dirs::home_dir).unwrap_or_else(|| PathBuf::from(".")).join("Flashjot")
}

/// The saved notes folder, or `fallback` if it can't be used (e.g. a removed drive).
/// The setting is kept, so the folder is used again once it is back.
fn open_store(root: PathBuf, fallback: PathBuf) -> Store {
    let store = Store::new(root);
    let Err(e) = store.ensure() else { return store };
    eprintln!("flashjot: notes folder {} unusable ({e}), using {}", store.root().display(), fallback.display());
    let store = Store::new(fallback);
    if let Err(e) = store.ensure() {
        eprintln!("flashjot: notes folder {}: {e}", store.root().display());
    }
    store
}

/// Creates the notes folder first, so a folder that can't be created is never saved.
fn save_with_notes_dir(settings_path: &Path, settings: &Settings) -> io::Result<Store> {
    let store = Store::new(notes_root(settings));
    store.ensure()?;
    settings::save(settings_path, settings)?;
    Ok(store)
}

type CmdResult<T> = Result<T, String>;

// Commands that scan the whole notebook are `async`: Tauri then runs them on a worker
// thread instead of the main thread, so a large folder never freezes the windows.

fn changed(app: &AppHandle) {
    let _ = app.emit("notes-changed", ());
}

fn with_store<T>(
    state: &State<AppState>,
    f: impl FnOnce(&Store) -> Result<T, crate::store::StoreError>,
) -> CmdResult<T> {
    let store = state.store.lock().map_err(|e| e.to_string())?;
    f(&store).map_err(|e| e.to_string())
}

/// What the quick box saved: an Inbox note, or tasks (text starting with "[]") on the Tasks page.
#[derive(Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum QuickSaved {
    Note { path: String },
    Tasks { path: String, count: usize },
}

/// `tasks_title` is the Tasks page title in the UI language, used when the page is first created.
#[tauri::command]
pub fn add_quick_note(app: AppHandle, state: State<AppState>, text: String, tasks_title: String) -> CmdResult<QuickSaved> {
    let saved = match store::parse_tasks(&text) {
        None => {
            let now = chrono::Local::now().naive_local();
            let meta = with_store(&state, |s| s.add_inbox(&text, now))?;
            QuickSaved::Note { path: meta.path }
        }
        // Only "[]": nothing to save, the box stays open.
        Some(tasks) if tasks.is_empty() => return Ok(QuickSaved::Tasks { path: String::new(), count: 0 }),
        Some(tasks) => {
            let stored = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
            let path = with_store(&state, |s| s.add_tasks(stored.as_deref(), &tasks_title, &tasks))?;
            if stored.as_deref() != Some(path.as_str()) {
                let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
                settings.tasks_page = Some(path.clone());
                settings::save(&state.settings_path, &settings).map_err(|e| e.to_string())?;
            }
            QuickSaved::Tasks { path, count: tasks.len() }
        }
    };
    changed(&app);
    Ok(saved)
}

#[tauri::command(async)]
pub fn list_inbox(state: State<AppState>) -> CmdResult<Vec<NoteMeta>> {
    with_store(&state, |s| s.list_inbox())
}

#[tauri::command(async)]
pub fn get_tree(state: State<AppState>) -> CmdResult<Tree> {
    with_store(&state, |s| s.tree())
}

#[tauri::command]
pub fn read_note(state: State<AppState>, path: String) -> CmdResult<Note> {
    with_store(&state, |s| s.read(&path))
}

/// Autosave target; does not emit `notes-changed` to avoid reloading the editor on every keystroke.
/// `modified` is the time from `read_note` or the last save; returns the new one.
#[tauri::command]
pub fn write_note(state: State<AppState>, path: String, content: String, modified: Option<i64>) -> CmdResult<i64> {
    with_store(&state, |s| s.write(&path, &content, modified))
}

#[tauri::command]
pub fn create_folder(app: AppHandle, state: State<AppState>, name: String) -> CmdResult<()> {
    with_store(&state, |s| s.create_folder(&name))?;
    changed(&app);
    Ok(())
}

#[tauri::command]
pub fn create_page(app: AppHandle, state: State<AppState>, folder: String, title: String) -> CmdResult<NoteMeta> {
    let meta = with_store(&state, |s| s.create_page(&folder, &title))?;
    changed(&app);
    Ok(meta)
}

#[tauri::command]
pub fn rename_note(app: AppHandle, state: State<AppState>, path: String, title: String) -> CmdResult<NoteMeta> {
    let meta = with_store(&state, |s| s.rename(&path, &title))?;
    changed(&app);
    Ok(meta)
}

#[tauri::command]
pub fn move_note(app: AppHandle, state: State<AppState>, path: String, folder: String) -> CmdResult<NoteMeta> {
    let meta = with_store(&state, |s| s.move_to(&path, &folder))?;
    changed(&app);
    Ok(meta)
}

#[tauri::command]
pub fn trash_note(app: AppHandle, state: State<AppState>, path: String) -> CmdResult<String> {
    let trash_path = with_store(&state, |s| s.trash(&path))?;
    changed(&app);
    Ok(trash_path)
}

#[tauri::command]
pub fn restore_note(app: AppHandle, state: State<AppState>, trash_path: String, original_path: String) -> CmdResult<()> {
    with_store(&state, |s| s.restore(&trash_path, &original_path))?;
    changed(&app);
    Ok(())
}

#[tauri::command(async)]
pub fn search_notes(state: State<AppState>, query: String) -> CmdResult<Vec<Hit>> {
    with_store(&state, |s| s.search(&query))
}

#[tauri::command(async)]
pub fn open_tasks(state: State<AppState>) -> CmdResult<Vec<TaskGroup>> {
    let first = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
    with_store(&state, |s| s.open_tasks(first.as_deref()))
}

#[tauri::command(async)]
pub fn set_task(app: AppHandle, state: State<AppState>, path: String, line: usize, text: String, done: bool) -> CmdResult<()> {
    with_store(&state, |s| s.set_task(&path, line, &text, done))?;
    changed(&app);
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> CmdResult<Settings> {
    Ok(state.settings.lock().map_err(|e| e.to_string())?.clone())
}

/// Saves settings, re-registers shortcuts and autostart, switches the notes folder.
/// Returns human-readable problems (e.g. a shortcut taken by another app); empty = all good.
#[tauri::command]
pub fn set_settings(app: AppHandle, state: State<AppState>, mut settings: Settings) -> CmdResult<Vec<String>> {
    // The UI never edits the Tasks page; keep the stored one.
    settings.tasks_page = state.settings.lock().map_err(|e| e.to_string())?.tasks_page.clone();
    let next = save_with_notes_dir(&state.settings_path, &settings).map_err(|e| e.to_string())?;
    let new_root = {
        let mut store = state.store.lock().map_err(|e| e.to_string())?;
        let new_root = store.root() != next.root();
        if new_root {
            *store = next;
        }
        new_root
    };
    *state.settings.lock().map_err(|e| e.to_string())? = settings.clone();
    let mut problems = shortcuts::apply(&app, &settings);
    if let Err(e) = crate::sync_autostart(&app, settings.launch_at_login) {
        problems.push(e);
    }
    let _ = app.emit("settings-changed", ());
    if new_root {
        changed(&app);
    }
    Ok(problems)
}

#[tauri::command]
pub fn notes_dir(state: State<AppState>) -> CmdResult<String> {
    with_store(&state, |s| Ok(s.root().to_string_lossy().into_owned()))
}

#[tauri::command]
pub fn reveal_notes_dir(state: State<AppState>) -> CmdResult<()> {
    let root = with_store(&state, |s| Ok(s.root().to_path_buf()))?;
    tauri_plugin_opener::open_path(root, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn hide_window(window: tauri::WebviewWindow) -> CmdResult<()> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn open_notebook(app: AppHandle, path: Option<String>) -> CmdResult<()> {
    if let Some(q) = app.get_webview_window(windows::QUICK) {
        let _ = q.hide();
    }
    windows::show_notebook(&app);
    if let Some(path) = path {
        let _ = app.emit_to(windows::NOTEBOOK, "open-note", path);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn notes_in(dir: &Path) -> Settings {
        Settings { notes_dir: Some(dir.to_string_lossy().into_owned()), ..Settings::default() }
    }

    /// A path below a regular file can never be created.
    fn unusable(d: &tempfile::TempDir) -> PathBuf {
        fs::write(d.path().join("file"), "").unwrap();
        d.path().join("file/notes")
    }

    #[test]
    fn unusable_notes_dir_is_not_saved() {
        let d = tempfile::tempdir().unwrap();
        let settings_path = d.path().join("settings.json");
        assert!(save_with_notes_dir(&settings_path, &notes_in(&unusable(&d))).is_err());
        assert!(!settings_path.exists());
    }

    #[test]
    fn new_notes_dir_is_created_then_saved() {
        let d = tempfile::tempdir().unwrap();
        let settings_path = d.path().join("settings.json");
        let settings = notes_in(&d.path().join("notes"));
        let store = save_with_notes_dir(&settings_path, &settings).unwrap();
        assert_eq!(store.root(), d.path().join("notes"));
        assert!(d.path().join("notes/Inbox").is_dir());
        assert_eq!(settings::load(&settings_path), settings);
    }

    #[test]
    fn startup_falls_back_when_saved_notes_dir_is_unusable() {
        let d = tempfile::tempdir().unwrap();
        let fallback = d.path().join("default");
        let store = open_store(unusable(&d), fallback.clone());
        assert_eq!(store.root(), fallback);
        assert!(fallback.join("Inbox").is_dir());
    }
}
