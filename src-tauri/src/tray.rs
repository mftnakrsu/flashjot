//! Tray icon and its menu.

use crate::windows;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter};

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let quick = MenuItem::with_id(app, "quick", "Quick note", true, None::<&str>)?;
    let notebook = MenuItem::with_id(app, "notebook", "Notebook", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Flashjot", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let menu = Menu::with_items(app, &[&quick, &notebook, &settings, &sep, &quit])?;

    let mut tray = TrayIconBuilder::with_id("main")
        .tooltip("Flashjot")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quick" => windows::show_quick(app),
            "notebook" => windows::show_notebook(app),
            "settings" => {
                windows::show_notebook(app);
                let _ = app.emit_to(windows::NOTEBOOK, "open-settings", ());
            }
            "quit" => app.exit(0),
            _ => {}
        });
    if let Some(icon) = app.default_window_icon() {
        tray = tray.icon(icon.clone());
    }
    tray.build(app)?;
    Ok(())
}
