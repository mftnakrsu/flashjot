//! Watches the notes folder so changes made by other apps (an editor, a sync client,
//! flashjot-mcp) reach the windows as `notes-changed`. No Tauri dependency: `commands.rs`
//! passes in what to do on a change.

use notify_debouncer_mini::notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{DebounceEventResult, DebouncedEventBatch, Debouncer, new_debouncer};
use std::path::{Component, Path};
use std::time::Duration;

/// Changes closer together than this arrive as one batch, e.g. a sync client writing many files.
const DEBOUNCE: Duration = Duration::from_millis(300);

/// Stops watching when dropped.
pub type Watch = Debouncer<RecommendedWatcher>;

/// Starts watching `root` and everything below it; calls `on_change` at most once per batch,
/// and only when the batch touches something the notebook shows (see `is_relevant`).
/// `root` must be canonical: some systems (macOS) report canonical paths.
pub fn spawn(root: &Path, on_change: impl Fn() + Send + 'static) -> notify_debouncer_mini::notify::Result<Watch> {
    let base = root.to_path_buf();
    let mut debouncer = new_debouncer(DEBOUNCE, move |res: DebounceEventResult| match res {
        Ok(DebouncedEventBatch::Events(events)) => {
            if events.iter().any(|e| is_relevant(&base, &e.path)) {
                on_change();
            }
        }
        // Events were lost (e.g. a full queue): reload everything to be safe.
        Ok(DebouncedEventBatch::Rescan) => on_change(),
        Ok(_) => {}
        Err(e) => eprintln!("flashjot: watching notes folder: {e:?}"),
    })?;
    debouncer.watcher().watch(root, RecursiveMode::Recursive)?;
    Ok(debouncer)
}

/// A Markdown page or a folder, not inside a hidden folder (`.trash`, `.git`, `.obsidian`)
/// and not an `atomic_write` temp file (its final rename reports the `.md` path anyway).
pub fn is_relevant(root: &Path, path: &Path) -> bool {
    let Ok(rel) = path.strip_prefix(root) else { return false };
    let hidden = rel.components().any(|c| matches!(c, Component::Normal(n) if n.to_string_lossy().starts_with('.')));
    if hidden || rel.as_os_str().is_empty() {
        return false;
    }
    match path.extension() {
        Some(ext) => ext == "md",
        // No extension: a folder (created, renamed or removed).
        None => true,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::mpsc;
    use std::time::Duration;

    #[test]
    fn relevant_paths() {
        let root = Path::new("/n");
        assert!(is_relevant(root, Path::new("/n/Inbox/2026-11-23-101500.md")));
        assert!(is_relevant(root, Path::new("/n/Projects")));
        assert!(is_relevant(root, Path::new("/n/Projects/Idea.md")));
        assert!(!is_relevant(root, Path::new("/n/Projects/Idea.md.tmp")));
        assert!(!is_relevant(root, Path::new("/n/.trash/20261123 Idea.md")));
        assert!(!is_relevant(root, Path::new("/n/.obsidian/workspace.json")));
        assert!(!is_relevant(root, Path::new("/n/picture.png")));
        assert!(!is_relevant(root, Path::new("/n")));
        assert!(!is_relevant(root, Path::new("/elsewhere/Idea.md")));
    }

    #[test]
    fn reports_a_page_written_by_another_app() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move || {
            let _ = tx.send(());
        })
        .unwrap();
        std::fs::write(root.join("Idea.md"), "hello\n").unwrap();
        rx.recv_timeout(Duration::from_secs(5)).expect("notes-changed after a write");
    }

    #[test]
    fn ignores_the_trash() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        std::fs::create_dir(root.join(".trash")).unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move || {
            let _ = tx.send(());
        })
        .unwrap();
        std::fs::write(root.join(".trash/old.md"), "x\n").unwrap();
        assert!(rx.recv_timeout(Duration::from_millis(1500)).is_err());
    }
}
