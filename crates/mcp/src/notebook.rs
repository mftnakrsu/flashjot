//! What each tool does, on top of `flashjot_core`. No MCP types here, so every rule is
//! unit-tested directly; `server.rs` only turns these results into MCP replies.

use chrono::NaiveDateTime;
use flashjot_core::location::{self, default_root, notes_root, open_store};
use flashjot_core::settings::{self, Settings};
use flashjot_core::store::{self, Hit, Note, NoteMeta, Store, StoreError, TaskGroup};
use serde::Serialize;
use std::fmt::Write as _;
use std::io;
use std::path::PathBuf;

/// The store already caps search at this many hits.
pub const SEARCH_MAX: usize = 50;

/// The Tasks page titles the app uses (`tasks.pageTitle` in src/lib/i18n.svelte.ts).
const TASKS_TITLES: [&str; 2] = ["Tasks", "Görevler"];

pub struct Notebook {
    store: Store,
    /// Read on every call (the app may change it meanwhile), never written.
    settings_path: Option<PathBuf>,
}

/// A message for the agent, shown as a tool error.
#[derive(Debug, PartialEq)]
pub struct ToolError(pub String);

/// One note given to `capture`.
#[derive(Debug, PartialEq, Serialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum Captured {
    Note { path: String },
    Tasks { path: String, count: usize },
    Error { message: String },
}

/// Both paths `restore-note` needs.
#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Trashed {
    pub trash_path: String,
    pub original_path: String,
}

impl Notebook {
    /// `notes_dir` (`--notes-dir`) wins and then settings are only read from `settings_path`
    /// (`--settings`); otherwise the app's settings file and notes folder are used, with the
    /// same fallback as the app when the saved folder is unusable.
    pub fn open(notes_dir: Option<PathBuf>, settings_path: Option<PathBuf>) -> io::Result<Notebook> {
        match notes_dir {
            Some(dir) => {
                let store = Store::new(dir);
                store.ensure()?;
                Ok(Notebook { store, settings_path })
            }
            None => {
                let settings_path = settings_path.or_else(location::settings_path);
                let s = settings_path.as_deref().map(settings::peek).unwrap_or_default();
                Ok(Notebook { store: open_store(notes_root(&s), default_root()), settings_path })
            }
        }
    }

    pub fn root(&self) -> &std::path::Path {
        self.store.root()
    }

    fn settings(&self) -> Settings {
        self.settings_path.as_deref().map(settings::peek).unwrap_or_default()
    }

    /// Saves each note on its own, like the quick box: text starting with "[]" adds tasks to
    /// the Tasks page, anything else becomes an Inbox note. One failure doesn't stop the rest.
    pub fn capture(&self, notes: &[String], now: NaiveDateTime) -> Vec<Captured> {
        notes
            .iter()
            .map(|text| self.capture_one(text, now).unwrap_or_else(|ToolError(message)| Captured::Error { message }))
            .collect()
    }

    fn capture_one(&self, text: &str, now: NaiveDateTime) -> Result<Captured, ToolError> {
        match store::parse_tasks(text) {
            None => {
                let meta = self.store.add_inbox(text, now).map_err(|e| message(e, ""))?;
                Ok(Captured::Note { path: meta.path })
            }
            Some(tasks) if tasks.is_empty() => Err(ToolError("Only \"[]\": write the tasks after it.".into())),
            Some(tasks) => {
                let s = self.settings();
                let title = self.tasks_title(&s);
                let path = self.store.add_tasks(s.tasks_page.as_deref(), &title, &tasks).map_err(|e| message(e, &title))?;
                Ok(Captured::Tasks { path, count: tasks.len() })
            }
        }
    }

    /// The title `add_tasks` uses when settings name no Tasks page (or it is gone): the only
    /// existing `Tasks.md`/`Görevler.md` at the root, else the app's title for its language.
    fn tasks_title(&self, s: &Settings) -> String {
        let existing: Vec<&str> =
            TASKS_TITLES.into_iter().filter(|t| self.store.root().join(format!("{t}.md")).is_file()).collect();
        match existing.as_slice() {
            [only] => only.to_string(),
            _ => tasks_title(&s.language, sys_locale::get_locale()).to_string(),
        }
    }

    pub fn list_inbox(&self) -> Result<Vec<NoteMeta>, ToolError> {
        self.store.list_inbox().map_err(|e| message(e, ""))
    }

    /// Markdown: the Inbox count, root pages, then each folder with its pages.
    pub fn overview(&self) -> Result<String, ToolError> {
        let tree = self.store.tree().map_err(|e| message(e, ""))?;
        let inbox = self.list_inbox()?.len();
        let mut out = format!("# Notebook ({})\n\n- Inbox: {inbox} notes (list-inbox shows them)\n", self.root().display());
        for page in &tree.root_pages {
            let _ = writeln!(out, "- {}", page.path);
        }
        for folder in &tree.folders {
            let _ = writeln!(out, "\n## {}\n", folder.name);
            if folder.pages.is_empty() {
                out.push_str("(no pages)\n");
            }
            for page in &folder.pages {
                let _ = writeln!(out, "- {}", page.path);
            }
        }
        Ok(out)
    }

    pub fn read(&self, path: &str) -> Result<Note, ToolError> {
        self.store.read(path).map_err(|e| message(e, path))
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<Hit>, ToolError> {
        let mut hits = self.store.search(query).map_err(|e| message(e, ""))?;
        hits.truncate(limit.clamp(1, SEARCH_MAX));
        Ok(hits)
    }

    pub fn open_tasks(&self) -> Result<Vec<TaskGroup>, ToolError> {
        let first = self.settings().tasks_page;
        self.store.open_tasks(first.as_deref()).map_err(|e| message(e, ""))
    }

    pub fn set_task(&self, path: &str, line: usize, text: &str, done: bool) -> Result<(), ToolError> {
        self.store.set_task(path, line, text, done).map_err(|e| message(e, path))
    }

    /// Replaces an existing note, only if it is unchanged since `modified` (from `read`).
    /// New notes come from `create_page`, so a mistyped path never creates a file.
    pub fn write(&self, path: &str, content: &str, modified: i64) -> Result<i64, ToolError> {
        self.read(path)?;
        self.store.write(path, content, Some(modified)).map_err(|e| message(e, path))
    }

    pub fn create_folder(&self, name: &str) -> Result<(), ToolError> {
        self.store.create_folder(name).map_err(|e| message(e, name))
    }

    pub fn create_page(&self, folder: &str, title: &str) -> Result<NoteMeta, ToolError> {
        self.store.create_page(folder, title).map_err(|e| message(e, title))
    }

    pub fn rename(&self, path: &str, title: &str) -> Result<NoteMeta, ToolError> {
        self.store.rename(path, title).map_err(|e| message(e, path))
    }

    pub fn move_to(&self, path: &str, folder: &str) -> Result<NoteMeta, ToolError> {
        self.store.move_to(path, folder).map_err(|e| message(e, path))
    }

    pub fn trash(&self, path: &str) -> Result<Trashed, ToolError> {
        let trash_path = self.store.trash(path).map_err(|e| message(e, path))?;
        Ok(Trashed { trash_path, original_path: path.to_string() })
    }

    pub fn restore(&self, trash_path: &str, original_path: &str) -> Result<(), ToolError> {
        self.store.restore(trash_path, original_path).map_err(|e| message(e, trash_path))
    }
}

/// The app's `tasks.pageTitle` for the `language` setting; "auto" follows the system locale
/// the way the UI's `detect()` follows `navigator.language`.
pub fn tasks_title(language: &str, locale: Option<String>) -> &'static str {
    let turkish = match language {
        "tr" => true,
        "en" => false,
        _ => locale.is_some_and(|l| l.to_lowercase().starts_with("tr")),
    };
    if turkish { "Görevler" } else { "Tasks" }
}

/// Store errors as messages an agent can act on (spec §5).
fn message(e: StoreError, subject: &str) -> ToolError {
    ToolError(match e {
        StoreError::Empty => "The note is empty.".into(),
        StoreError::InvalidPath | StoreError::NotFound => {
            format!("No note at \"{subject}\". Use search or list-notebook to find it.")
        }
        StoreError::InvalidName => format!(
            "\"{subject}\" can't be used as a name: it is empty, starts with a dot, is longer than 200 bytes or contains / \\ : * ? \" < > |."
        ),
        StoreError::ReservedName => {
            format!("\"{subject}\" can't be used as a name: Windows reserves it (CON, NUL, COM1… or a name ending in a dot).")
        }
        StoreError::Conflict => "The note changed since it was read. Read it again with read-note and redo the change.".into(),
        StoreError::Io(e) => e.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    fn now() -> NaiveDateTime {
        NaiveDateTime::parse_from_str("2026-11-23 10:15:00", "%Y-%m-%d %H:%M:%S").unwrap()
    }

    /// A notebook in a temp folder, with a settings file holding `settings_json` (if any).
    fn notebook(settings_json: Option<&str>) -> (tempfile::TempDir, Notebook) {
        let d = tempfile::tempdir().unwrap();
        let settings_path = d.path().join("settings.json");
        if let Some(json) = settings_json {
            fs::write(&settings_path, json).unwrap();
        }
        let nb = Notebook::open(Some(d.path().join("notes")), Some(settings_path)).unwrap();
        (d, nb)
    }

    fn file(nb: &Notebook, rel: &str) -> String {
        fs::read_to_string(nb.root().join(rel)).unwrap()
    }

    #[test]
    fn capture_saves_notes_and_tasks_and_reports_each() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        let out = nb.capture(&["first idea".into(), "[] milk\nbread".into(), "   ".into(), "second idea".into()], now());
        assert_eq!(out[0], Captured::Note { path: "Inbox/2026-11-23-101500.md".into() });
        assert_eq!(out[1], Captured::Tasks { path: "Tasks.md".into(), count: 2 });
        assert_eq!(out[2], Captured::Error { message: "The note is empty.".into() });
        assert_eq!(out[3], Captured::Note { path: "Inbox/2026-11-23-101500-2.md".into() });
        assert_eq!(file(&nb, "Tasks.md"), "- [ ] milk\n- [ ] bread\n");
        assert_eq!(file(&nb, "Inbox/2026-11-23-101500.md"), "first idea\n");
    }

    #[test]
    fn capture_of_only_brackets_is_an_error() {
        let (_d, nb) = notebook(None);
        assert!(matches!(&nb.capture(&["[]".into()], now())[0], Captured::Error { .. }));
    }

    #[test]
    fn tasks_go_to_the_page_named_in_settings() {
        let (_d, nb) = notebook(Some(r#"{"language":"en","tasksPage":"Lists/Todo.md"}"#));
        fs::create_dir_all(nb.root().join("Lists")).unwrap();
        fs::write(nb.root().join("Lists/Todo.md"), "# Todo\n").unwrap();
        nb.capture(&["[] call Ana".into()], now());
        assert_eq!(file(&nb, "Lists/Todo.md"), "# Todo\n- [ ] call Ana\n");
        assert!(!nb.root().join("Tasks.md").exists());
    }

    #[test]
    fn tasks_go_to_the_only_existing_default_page_whatever_the_language() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        fs::write(nb.root().join("Görevler.md"), "").unwrap();
        nb.capture(&["[] süt".into()], now());
        assert_eq!(file(&nb, "Görevler.md"), "- [ ] süt\n");
        assert!(!nb.root().join("Tasks.md").exists());
    }

    #[test]
    fn tasks_page_title_follows_the_language() {
        let (_d, nb) = notebook(Some(r#"{"language":"tr"}"#));
        nb.capture(&["[] süt".into()], now());
        assert_eq!(file(&nb, "Görevler.md"), "- [ ] süt\n");
    }

    #[test]
    fn tasks_title_for_each_language() {
        assert_eq!(tasks_title("en", Some("tr-TR".into())), "Tasks");
        assert_eq!(tasks_title("tr", None), "Görevler");
        assert_eq!(tasks_title("auto", Some("tr-TR".into())), "Görevler");
        assert_eq!(tasks_title("auto", Some("en-US".into())), "Tasks");
        assert_eq!(tasks_title("auto", None), "Tasks");
    }

    #[test]
    fn the_server_never_writes_settings() {
        let (d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["[] milk".into()], now());
        assert_eq!(fs::read_to_string(d.path().join("settings.json")).unwrap(), r#"{"language":"en"}"#);
    }

    #[test]
    fn write_needs_the_time_from_read() {
        let (_d, nb) = notebook(None);
        let page = nb.create_page("", "Plan").unwrap();
        let note = nb.read(&page.path).unwrap();
        // Someone else saves the page after the agent read it.
        std::thread::sleep(std::time::Duration::from_millis(20));
        fs::write(nb.root().join("Plan.md"), "edited in another app\n").unwrap();
        let err = nb.write(&page.path, "agent text\n", note.modified).unwrap_err();
        assert!(err.0.contains("changed since it was read"));
        assert_eq!(file(&nb, "Plan.md"), "edited in another app\n");
        let fresh = nb.read(&page.path).unwrap();
        nb.write(&page.path, "agent text\n", fresh.modified).unwrap();
        assert_eq!(file(&nb, "Plan.md"), "agent text\n");
    }

    #[test]
    fn write_never_creates_a_note() {
        let (_d, nb) = notebook(None);
        let err = nb.write("Typo.md", "x", 0).unwrap_err();
        assert!(err.0.starts_with("No note at \"Typo.md\""));
        assert!(!nb.root().join("Typo.md").exists());
    }

    #[test]
    fn set_task_refuses_a_line_that_changed() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["[] milk\nbread".into()], now());
        let groups = nb.open_tasks().unwrap();
        assert_eq!(groups[0].path, "Tasks.md");
        let bread = &groups[0].tasks[1];
        assert!(nb.set_task("Tasks.md", bread.line, "milk", true).is_err());
        nb.set_task("Tasks.md", bread.line, &bread.text, true).unwrap();
        assert_eq!(file(&nb, "Tasks.md"), "- [ ] milk\n- [x] bread\n");
    }

    #[test]
    fn trash_then_restore() {
        let (_d, nb) = notebook(None);
        let page = nb.create_page("Projects", "Idea").unwrap();
        let t = nb.trash(&page.path).unwrap();
        assert_eq!(t.original_path, "Projects/Idea.md");
        assert!(t.trash_path.starts_with(".trash/"));
        assert!(!nb.root().join("Projects/Idea.md").exists());
        nb.restore(&t.trash_path, &t.original_path).unwrap();
        assert!(nb.root().join("Projects/Idea.md").exists());
    }

    #[test]
    fn paths_outside_the_notes_folder_are_refused() {
        let (_d, nb) = notebook(None);
        for bad in ["../settings.json", "/etc/passwd", ".trash/x.md", "a\\b.md"] {
            assert!(nb.read(bad).is_err(), "{bad}");
        }
        assert!(nb.create_folder("../outside").is_err());
        assert!(!nb.root().parent().unwrap().join("outside").exists());
    }

    #[test]
    fn search_keeps_the_first_limit_hits() {
        let (_d, nb) = notebook(None);
        for i in 0..5 {
            fs::write(nb.root().join(format!("Note {i}.md")), "apple\n").unwrap();
        }
        assert_eq!(nb.search("apple", 3).unwrap().len(), 3);
        assert_eq!(nb.search("apple", 0).unwrap().len(), 1);
    }

    #[test]
    fn overview_lists_inbox_pages_and_folders() {
        let (_d, nb) = notebook(Some(r#"{"language":"en"}"#));
        nb.capture(&["idea".into(), "[] milk".into()], now());
        nb.create_page("Projects", "Flashjot ideas").unwrap();
        nb.create_folder("Empty").unwrap();
        let md = nb.overview().unwrap();
        assert!(md.contains("- Inbox: 1 notes"), "{md}");
        assert!(md.contains("- Tasks.md\n"), "{md}");
        assert!(md.contains("## Projects\n\n- Projects/Flashjot ideas.md\n"), "{md}");
        assert!(md.contains("## Empty\n\n(no pages)\n"), "{md}");
    }

    #[test]
    fn notes_dir_is_created() {
        let d = tempfile::tempdir().unwrap();
        let nb = Notebook::open(Some(d.path().join("new/notes")), None).unwrap();
        assert!(nb.root().join("Inbox").is_dir());
        assert!(Path::new(&nb.root()).ends_with("new/notes"));
    }
}
