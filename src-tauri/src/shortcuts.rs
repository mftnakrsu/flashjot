//! Global shortcuts from settings.

use crate::commands::AppState;
use crate::settings::Settings;
use crate::windows;
use tauri::{AppHandle, Manager, Wry};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutEvent, ShortcutState};

pub fn plugin() -> tauri::plugin::TauriPlugin<Wry> {
    tauri_plugin_global_shortcut::Builder::new().with_handler(on_shortcut).build()
}

fn on_shortcut(app: &AppHandle, shortcut: &Shortcut, event: ShortcutEvent) {
    if event.state() != ShortcutState::Pressed {
        return;
    }
    let state = app.state::<AppState>();
    let Ok(settings) = state.settings.lock().map(|s| s.clone()) else { return };
    if parse(&settings.quick_shortcut).as_ref() == Some(shortcut) {
        windows::toggle_quick(app);
    } else if parse(&settings.notebook_shortcut).as_ref() == Some(shortcut) {
        windows::show_notebook(app);
    }
}

fn parse(accelerator: &str) -> Option<Shortcut> {
    accelerator.trim().parse().ok()
}

/// Replace all registered shortcuts. Returns one message per shortcut that failed.
pub fn apply(app: &AppHandle, settings: &Settings) -> Vec<String> {
    let gs = app.global_shortcut();
    let _ = gs.unregister_all();
    let mut problems = Vec::new();
    for accel in [&settings.quick_shortcut, &settings.notebook_shortcut] {
        if accel.trim().is_empty() {
            continue;
        }
        match accel.trim().parse::<Shortcut>() {
            Ok(sc) => {
                if let Err(e) = gs.register(sc) {
                    problems.push(format!("{accel}: {e}"));
                }
            }
            Err(e) => problems.push(format!("{accel}: {e}")),
        }
    }
    problems
}
