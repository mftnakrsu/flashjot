mod commands;
mod settings;
mod shortcuts;
mod store;
mod tray;
mod windows;

use commands::AppState;
use tauri::{AppHandle, Manager};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};

/// `--quick` / `--notebook` come from desktop shortcuts (Wayland) or a second launch;
/// `--hidden` comes from autostart.
fn handle_args(app: &AppHandle, args: &[String], first_launch: bool) {
    let has = |flag: &str| args.iter().any(|a| a == flag);
    if has("--quick") {
        windows::show_quick(app);
    } else if first_launch && has("--hidden") {
        // Started at login: stay in the tray.
    } else {
        windows::show_notebook(app);
    }
}

pub(crate) fn sync_autostart(app: &AppHandle, enabled: bool) -> Result<(), String> {
    // Dev builds would register the debug binary; only touch autostart in release.
    if cfg!(debug_assertions) {
        return Ok(());
    }
    let launcher = app.autolaunch();
    let current = launcher.is_enabled().unwrap_or(false);
    let result = match (enabled, current) {
        (true, false) => launcher.enable(),
        (false, true) => launcher.disable(),
        _ => Ok(()),
    };
    result.map_err(|e| format!("launch at login: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Must be the first plugin.
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            handle_args(app, &args, false);
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--hidden"])))
        .plugin(shortcuts::plugin())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            let config_dir = app.path().app_config_dir()?;
            app.manage(AppState::new(config_dir.join("settings.json")));

            let handle = app.handle().clone();
            windows::setup(&handle)?;
            tray::setup(&handle)?;

            let settings = app.state::<AppState>().settings.lock().unwrap().clone();
            for problem in shortcuts::apply(&handle, &settings) {
                eprintln!("flashjot: shortcut not registered: {problem}");
            }
            if let Err(e) = sync_autostart(&handle, settings.launch_at_login) {
                eprintln!("flashjot: {e}");
            }

            let args: Vec<String> = std::env::args().collect();
            handle_args(&handle, &args, true);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::add_quick_note,
            commands::list_inbox,
            commands::get_tree,
            commands::read_note,
            commands::write_note,
            commands::create_folder,
            commands::create_page,
            commands::rename_note,
            commands::move_note,
            commands::trash_note,
            commands::restore_note,
            commands::search_notes,
            commands::get_settings,
            commands::set_settings,
            commands::notes_dir,
            commands::reveal_notes_dir,
            commands::hide_window,
            commands::open_notebook,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
