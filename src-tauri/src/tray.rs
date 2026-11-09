//! Tray icon and its menu.

use crate::commands::TrayLabels;
use crate::windows;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, Wry};

/// The menu items, kept so their labels can follow the UI language.
struct TrayItems {
    quick: MenuItem<Wry>,
    notebook: MenuItem<Wry>,
    settings: MenuItem<Wry>,
    quit: MenuItem<Wry>,
}

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    // English until the frontend sends labels in the UI language (set_labels).
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
    app.manage(TrayItems { quick, notebook, settings, quit });
    Ok(())
}

pub fn set_labels(app: &AppHandle, labels: &TrayLabels) -> tauri::Result<()> {
    let items = app.state::<TrayItems>();
    items.quick.set_text(&labels.quick)?;
    items.notebook.set_text(&labels.notebook)?;
    items.settings.set_text(&labels.settings)?;
    items.quit.set_text(&labels.quit)?;
    Ok(())
}
