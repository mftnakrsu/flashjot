//! Tauri commands called from the frontend. Thin wrappers around `store` and `settings`.

use crate::settings::{self, Settings};
use crate::store::{Hit, NoteMeta, Store, Tree};
use crate::{shortcuts, windows};
use std::path::PathBuf;
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
        let store = Store::new(notes_root(&settings));
        let _ = store.ensure();
        AppState { store: Mutex::new(store), settings: Mutex::new(settings), settings_path }
    }
}

pub fn notes_root(s: &Settings) -> PathBuf {
    match s.notes_dir.as_deref().map(str::trim) {
        Some(dir) if !dir.is_empty() => PathBuf::from(dir),
        _ => dirs::document_dir()
            .or_else(dirs::home_dir)
            .unwrap_or_else(|| PathBuf::from("."))
            .join("Flashjot"),
    }
}

type CmdResult<T> = Result<T, String>;

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

#[tauri::command]
pub fn add_quick_note(app: AppHandle, state: State<AppState>, text: String) -> CmdResult<NoteMeta> {
    let now = chrono::Local::now().naive_local();
    let meta = with_store(&state, |s| s.add_inbox(&text, now))?;
    changed(&app);
    Ok(meta)
}

#[tauri::command]
pub fn list_inbox(state: State<AppState>) -> CmdResult<Vec<NoteMeta>> {
    with_store(&state, |s| s.list_inbox())
}

#[tauri::command]
pub fn get_tree(state: State<AppState>) -> CmdResult<Tree> {
    with_store(&state, |s| s.tree())
}

#[tauri::command]
pub fn read_note(state: State<AppState>, path: String) -> CmdResult<String> {
    with_store(&state, |s| s.read(&path))
}

/// Autosave target; does not emit `notes-changed` to avoid reloading the editor on every keystroke.
#[tauri::command]
pub fn write_note(state: State<AppState>, path: String, content: String) -> CmdResult<()> {
    with_store(&state, |s| s.write(&path, &content))
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

#[tauri::command]
pub fn search_notes(state: State<AppState>, query: String) -> CmdResult<Vec<Hit>> {
    with_store(&state, |s| s.search(&query))
}

#[tauri::command]
pub fn get_settings(state: State<AppState>) -> CmdResult<Settings> {
    Ok(state.settings.lock().map_err(|e| e.to_string())?.clone())
}

/// Saves settings, re-registers shortcuts and autostart, switches the notes folder.
/// Returns human-readable problems (e.g. a shortcut taken by another app); empty = all good.
#[tauri::command]
pub fn set_settings(app: AppHandle, state: State<AppState>, settings: Settings) -> CmdResult<Vec<String>> {
    settings::save(&state.settings_path, &settings).map_err(|e| e.to_string())?;
    let new_root = notes_root(&settings);
    {
        let mut store = state.store.lock().map_err(|e| e.to_string())?;
        if store.root() != new_root {
            let next = Store::new(new_root);
            next.ensure().map_err(|e| e.to_string())?;
            *store = next;
        }
    }
    *state.settings.lock().map_err(|e| e.to_string())? = settings.clone();
    let mut problems = shortcuts::apply(&app, &settings);
    if let Err(e) = crate::sync_autostart(&app, settings.launch_at_login) {
        problems.push(e);
    }
    changed(&app);
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
