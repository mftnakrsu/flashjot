//! Watches the notes folder so changes made by other apps (an editor, a sync client,
//! flashjot-mcp) reach the windows as `notes-changed`. No Tauri dependency: `commands.rs`
//! passes in what to do on a change.

use notify_debouncer_mini::notify::{RecommendedWatcher, RecursiveMode};
use notify_debouncer_mini::{DebounceEventResult, DebouncedEventBatch, Debouncer, new_debouncer};
use std::collections::HashMap;
use std::path::{Component, Path, PathBuf};
use std::time::Duration;

/// Changes closer together than this arrive as one batch, e.g. a sync client writing many files.
const DEBOUNCE: Duration = Duration::from_millis(300);

/// Stops watching when dropped.
pub type Watch = Debouncer<RecommendedWatcher>;

/// Starts watching `root` and everything below it; calls `on_change` at most once per batch,
/// and only when the batch touches something the notebook shows (see `is_relevant`), with
/// those paths; `None` means events were lost and everything may have changed.
/// `root` must be canonical: some systems (macOS) report canonical paths.
pub fn spawn(
    root: &Path,
    on_change: impl Fn(Option<&[PathBuf]>) + Send + 'static,
) -> notify_debouncer_mini::notify::Result<Watch> {
    let base = root.to_path_buf();
    let mut debouncer = new_debouncer(DEBOUNCE, move |res: DebounceEventResult| match res {
        Ok(DebouncedEventBatch::Events(events)) => {
            let relevant: Vec<PathBuf> =
                events.into_iter().map(|e| e.path).filter(|p| is_relevant(&base, p)).collect();
            if !relevant.is_empty() {
                on_change(Some(&relevant));
            }
        }
        // Events were lost (e.g. a full queue): reload everything to be safe.
        Ok(DebouncedEventBatch::Rescan) => on_change(None),
        Ok(_) => {}
        Err(e) => eprintln!("flashjot: watching notes folder: {e:?}"),
    })?;
    debouncer.watcher().watch(root, RecursiveMode::Recursive)?;
    Ok(debouncer)
}

/// Pages the app itself saved (autosave), each with the time that save left on disk, so the
/// watcher can drop the echo of an autosave instead of rescanning the whole notebook.
#[derive(Default)]
pub struct OwnWrites(HashMap<PathBuf, i64>);

impl OwnWrites {
    /// Remembers at most this many pages; an autosave touches one page at a time.
    const MAX: usize = 64;

    /// `rel` is the page path relative to the notes folder, as the store takes it.
    pub fn record(&mut self, rel: &str, modified: i64) {
        if self.0.len() >= Self::MAX {
            self.0.clear();
        }
        self.0.insert(PathBuf::from(rel), modified);
    }

    pub fn clear(&mut self) {
        self.0.clear();
    }

    /// True when every path in `changed` is a page we saved and its time on disk (`modified_of`)
    /// is still the one our save left, i.e. nobody else wrote it since.
    pub fn is_echo(&self, root: &Path, changed: &[PathBuf], modified_of: impl Fn(&Path) -> i64) -> bool {
        !changed.is_empty()
            && changed.iter().all(|path| {
                let Ok(rel) = path.strip_prefix(root) else { return false };
                self.0.get(rel).is_some_and(|&m| m == modified_of(path))
            })
    }
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
        Some(ext) if ext == "md" => true,
        Some(ext) if ext == "tmp" => false,
        // Anything else that is not a file is a folder (created, renamed or removed),
        // including one with a dot in its name such as "Q4.2026".
        _ => !path.is_file(),
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
        assert!(!is_relevant(root, Path::new("/n")));
        assert!(!is_relevant(root, Path::new("/elsewhere/Idea.md")));
    }

    #[test]
    fn a_batch_of_only_our_own_saves_is_an_echo() {
        let root = Path::new("/n");
        let mut own = OwnWrites::default();
        own.record("Ideas/a.md", 100);
        own.record("b.md", 200);
        let disk = |p: &Path| match p.to_str().unwrap() {
            "/n/Ideas/a.md" => 100,
            "/n/b.md" => 200,
            _ => 7,
        };
        assert!(own.is_echo(root, &[root.join("Ideas/a.md")], disk));
        assert!(own.is_echo(root, &[root.join("Ideas/a.md"), root.join("b.md")], disk));
    }

    #[test]
    fn a_batch_with_anything_else_is_not_an_echo() {
        let root = Path::new("/n");
        let mut own = OwnWrites::default();
        own.record("Ideas/a.md", 100);
        // Another app saved it after us: the time on disk moved on.
        assert!(!own.is_echo(root, &[root.join("Ideas/a.md")], |_| 150));
        // Our save plus another file in the same batch.
        assert!(!own.is_echo(root, &[root.join("Ideas/a.md"), root.join("c.md")], |_| 100));
        // A file we never wrote, and an empty batch.
        assert!(!own.is_echo(root, &[root.join("c.md")], |_| 100));
        assert!(!own.is_echo(root, &[], |_| 100));
        // A later save of the same page replaces the time we remember.
        own.record("Ideas/a.md", 300);
        assert!(!own.is_echo(root, &[root.join("Ideas/a.md")], |_| 100));
        assert!(own.is_echo(root, &[root.join("Ideas/a.md")], |_| 300));
    }

    #[test]
    fn a_folder_with_a_dot_in_its_name_is_relevant() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path();
        std::fs::create_dir(root.join("Q4.2026")).unwrap();
        std::fs::write(root.join("picture.png"), "").unwrap();
        assert!(is_relevant(root, &root.join("Q4.2026")));
        // Removed or renamed away: nothing left to look at, so it counts.
        assert!(is_relevant(root, &root.join("v1.0")));
        assert!(!is_relevant(root, &root.join("picture.png")));
        assert!(!is_relevant(root, &root.join("Q4.2026/Plan.md.tmp")));
    }

    #[test]
    fn reports_a_page_written_by_another_app() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move |paths| {
            let _ = tx.send(paths.map(|p| p.to_vec()));
        })
        .unwrap();
        std::fs::write(root.join("Idea.md"), "hello\n").unwrap();
        let paths = rx.recv_timeout(Duration::from_secs(5)).expect("notes-changed after a write");
        assert_eq!(paths, Some(vec![root.join("Idea.md")]));
    }

    #[test]
    fn a_save_through_the_store_is_reported_as_an_echo() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        let store = flashjot_core::store::Store::new(root.clone());
        let page = store.create_page("Ideas", "Plan").unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move |paths| {
            let _ = tx.send(paths.map(|p| p.to_vec()));
        })
        .unwrap();
        std::thread::sleep(Duration::from_millis(100));
        let mut own = OwnWrites::default();
        let next = store.write(&page.path, "typed\n", Some(page.modified)).unwrap();
        own.record(&page.path, next);
        let paths = rx.recv_timeout(Duration::from_secs(5)).expect("a batch after the save").expect("paths");
        assert!(own.is_echo(&root, &paths, flashjot_core::store::modified_ms), "{paths:?}");
    }

    #[test]
    fn ignores_the_trash() {
        let d = tempfile::tempdir().unwrap();
        let root = d.path().canonicalize().unwrap();
        std::fs::create_dir(root.join(".trash")).unwrap();
        let (tx, rx) = mpsc::channel();
        let _watch = spawn(&root, move |_| {
            let _ = tx.send(());
        })
        .unwrap();
        std::fs::write(root.join(".trash/old.md"), "x\n").unwrap();
        assert!(rx.recv_timeout(Duration::from_millis(1500)).is_err());
    }
}
