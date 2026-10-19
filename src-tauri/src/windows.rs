//! The two app windows. Both are created hidden at startup so showing them is instant.

use tauri::{AppHandle, Emitter, Manager, PhysicalPosition, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent};

pub const QUICK: &str = "quick";
pub const NOTEBOOK: &str = "notebook";
const QUICK_W: f64 = 560.0;
const QUICK_H: f64 = 168.0;

pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(app, QUICK, WebviewUrl::App("quick".into()))
        .title("Flashjot")
        .inner_size(QUICK_W, QUICK_H)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false)
        .build()?;

    let notebook = WebviewWindowBuilder::new(app, NOTEBOOK, WebviewUrl::App("notebook".into()))
        .title("Flashjot")
        .inner_size(1000.0, 680.0)
        .min_inner_size(640.0, 420.0)
        .visible(false)
        .build()?;

    // Closing the notebook only hides it; the app keeps running in the tray.
    let handle = notebook.clone();
    notebook.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = handle.hide();
        }
    });
    Ok(())
}

/// Shortcut behaviour: show the quick box, or hide it if it is already in front.
pub fn toggle_quick(app: &AppHandle) {
    let Some(win) = app.get_webview_window(QUICK) else { return };
    if win.is_visible().unwrap_or(false) && win.is_focused().unwrap_or(false) {
        let _ = win.hide();
    } else {
        show_quick(app);
    }
}

pub fn show_quick(app: &AppHandle) {
    let Some(win) = app.get_webview_window(QUICK) else { return };
    // Centre horizontally in the upper third of the monitor under the mouse.
    if let Ok(cursor) = app.cursor_position()
        && let Ok(Some(monitor)) = app.monitor_from_point(cursor.x, cursor.y)
    {
        let scale = monitor.scale_factor();
        let (mx, my) = (monitor.position().x, monitor.position().y);
        let (mw, mh) = (monitor.size().width as i32, monitor.size().height as i32);
        let w = (QUICK_W * scale) as i32;
        let _ = win.set_position(PhysicalPosition::new(mx + (mw - w) / 2, my + mh / 4));
    }
    present(&win);
    let _ = app.emit_to(QUICK, "quick-shown", ());
}

pub fn show_notebook(app: &AppHandle) {
    let Some(win) = app.get_webview_window(NOTEBOOK) else { return };
    present(&win);
}

fn present(win: &WebviewWindow) {
    let _ = win.show();
    let _ = win.unminimize();
    let _ = win.set_focus();
    #[cfg(target_os = "linux")]
    {
        let win = win.clone();
        let _ = win.clone().run_on_main_thread(move || present_with_server_time(&win));
    }
}

/// GNOME/Mutter ignores focus requests without a fresh timestamp (focus-stealing
/// prevention), so a window shown from a hotkey would appear but not take the keyboard.
/// Presenting with the current X server time is what polkit-gnome does for the same reason.
#[cfg(target_os = "linux")]
fn present_with_server_time(win: &WebviewWindow) {
    use gtk::prelude::*;
    let Ok(gtk_win) = win.gtk_window() else { return };
    let timestamp = gtk_win
        .window()
        .and_then(|w| w.downcast::<gdkx11::X11Window>().ok())
        .map(|x| gdkx11::functions::x11_get_server_time(&x))
        .unwrap_or(0); // Wayland: let GTK use its own activation token
    gtk_win.present_with_time(timestamp);
}
