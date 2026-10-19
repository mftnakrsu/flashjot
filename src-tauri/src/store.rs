//! Notes on disk. Plain Markdown files under one root folder.
//! This module has no Tauri dependency so it can be unit-tested.

use chrono::NaiveDateTime;
use serde::Serialize;
use std::fmt;
use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};

pub const INBOX: &str = "Inbox";
pub const TRASH: &str = ".trash";

#[derive(Debug)]
pub enum StoreError {
    Empty,
    InvalidPath,
    InvalidName,
    NotFound,
    Io(io::Error),
}

impl fmt::Display for StoreError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StoreError::Empty => write!(f, "note is empty"),
            StoreError::InvalidPath => write!(f, "invalid path"),
            StoreError::InvalidName => write!(f, "invalid name"),
            StoreError::NotFound => write!(f, "note not found"),
            StoreError::Io(e) => write!(f, "{e}"),
        }
    }
}

impl From<io::Error> for StoreError {
    fn from(e: io::Error) -> Self {
        if e.kind() == io::ErrorKind::NotFound {
            StoreError::NotFound
        } else {
            StoreError::Io(e)
        }
    }
}

#[derive(Debug, Serialize, Clone, PartialEq)]
pub struct NoteMeta {
    /// Path relative to the root, always '/'-separated.
    pub path: String,
    pub title: String,
    pub folder: String,
    /// Modification time, milliseconds since the Unix epoch.
    pub modified: i64,
    pub preview: String,
}

#[derive(Debug, Serialize)]
pub struct Folder {
    pub name: String,
    pub pages: Vec<NoteMeta>,
}

#[derive(Debug, Serialize)]
pub struct Tree {
    pub folders: Vec<Folder>,
    pub root_pages: Vec<NoteMeta>,
}

#[derive(Debug, Serialize)]
pub struct Hit {
    pub path: String,
    pub title: String,
    pub snippet: String,
}

pub struct Store {
    root: PathBuf,
}

impl Store {
    pub fn new(root: PathBuf) -> Self {
        Store { root }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn ensure(&self) -> io::Result<()> {
        fs::create_dir_all(self.root.join(INBOX))
    }

    pub fn add_inbox(&self, text: &str, now: NaiveDateTime) -> Result<NoteMeta, StoreError> {
        let text = text.trim();
        if text.is_empty() {
            return Err(StoreError::Empty);
        }
        let stem = now.format("%Y-%m-%d-%H%M%S").to_string();
        let path = unique_path(&self.root.join(INBOX), &stem, "-");
        atomic_write(&path, &format!("{text}\n"))?;
        self.meta(&path)
    }

    pub fn list_inbox(&self) -> Result<Vec<NoteMeta>, StoreError> {
        let mut items = self.pages_in(&self.root.join(INBOX))?;
        // Names are timestamps, so a reverse sort on the stem is newest first
        // ("…143205-2" sorts above "…143205").
        items.sort_by(|a, b| b.title.cmp(&a.title));
        Ok(items)
    }

    pub fn tree(&self) -> Result<Tree, StoreError> {
        let mut folders = Vec::new();
        let mut dirs = Vec::new();
        collect_dirs(&self.root, &mut dirs)?;
        for dir in dirs {
            let name = rel_string(&self.root, &dir);
            if name == INBOX {
                continue;
            }
            let mut pages = self.pages_in(&dir)?;
            sort_pages(&mut pages);
            folders.push(Folder { name, pages });
        }
        folders.sort_by_key(|f| f.name.to_lowercase());
        let mut root_pages = self.pages_in(&self.root)?;
        sort_pages(&mut root_pages);
        Ok(Tree { folders, root_pages })
    }

    pub fn read(&self, rel: &str) -> Result<String, StoreError> {
        let path = self.resolve(rel)?;
        Ok(fs::read_to_string(path)?)
    }

    pub fn write(&self, rel: &str, content: &str) -> Result<(), StoreError> {
        let path = self.resolve(rel)?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        atomic_write(&path, content)?;
        Ok(())
    }

    pub fn create_folder(&self, name: &str) -> Result<(), StoreError> {
        let dir = self.folder_dir(name)?;
        fs::create_dir_all(dir)?;
        Ok(())
    }

    pub fn create_page(&self, folder: &str, title: &str) -> Result<NoteMeta, StoreError> {
        let dir = self.folder_dir(folder)?;
        let title = valid_name(title)?;
        fs::create_dir_all(&dir)?;
        let path = unique_path(&dir, title, " ");
        atomic_write(&path, "")?;
        self.meta(&path)
    }

    pub fn rename(&self, rel: &str, new_title: &str) -> Result<NoteMeta, StoreError> {
        let from = self.existing(rel)?;
        let title = valid_name(new_title)?;
        let dir = from.parent().ok_or(StoreError::InvalidPath)?;
        if from.file_stem().is_some_and(|s| s == title) {
            return self.meta(&from);
        }
        let to = unique_path(dir, title, " ");
        fs::rename(&from, &to)?;
        self.meta(&to)
    }

    pub fn move_to(&self, rel: &str, folder: &str) -> Result<NoteMeta, StoreError> {
        let from = self.existing(rel)?;
        let dir = self.folder_dir(folder)?;
        fs::create_dir_all(&dir)?;
        let mut stem = from.file_stem().unwrap_or_default().to_string_lossy().into_owned();
        // Quick notes are named by timestamp; once filed they get a readable title.
        let from_inbox = from.parent() == Some(&self.root.join(INBOX)) && dir != self.root.join(INBOX);
        if from_inbox && let Some(title) = title_from_text(&fs::read_to_string(&from)?) {
            stem = title;
        }
        let to = unique_path(&dir, &stem, " ");
        fs::rename(&from, &to)?;
        self.meta(&to)
    }

    pub fn trash(&self, rel: &str) -> Result<String, StoreError> {
        let from = self.existing(rel)?;
        let trash = self.root.join(TRASH);
        fs::create_dir_all(&trash)?;
        let stamp = chrono::Local::now().format("%Y%m%d%H%M%S%3f");
        let stem = from.file_stem().unwrap_or_default().to_string_lossy();
        let to = unique_path(&trash, &format!("{stamp} {stem}"), " ");
        fs::rename(&from, &to)?;
        Ok(rel_string(&self.root, &to))
    }

    pub fn restore(&self, trash_rel: &str, original_rel: &str) -> Result<(), StoreError> {
        let from = self.root.join(check_rel(trash_rel, true)?);
        if !from.starts_with(self.root.join(TRASH)) {
            return Err(StoreError::InvalidPath);
        }
        let original = self.resolve(original_rel)?;
        let dir = original.parent().ok_or(StoreError::InvalidPath)?;
        fs::create_dir_all(dir)?;
        let stem = original.file_stem().unwrap_or_default().to_string_lossy().into_owned();
        fs::rename(&from, unique_path(dir, &stem, " "))?;
        Ok(())
    }

    pub fn search(&self, q: &str) -> Result<Vec<Hit>, StoreError> {
        let needle = q.trim().to_lowercase();
        if needle.is_empty() {
            return Ok(Vec::new());
        }
        let mut files = Vec::new();
        collect_md(&self.root, &mut files)?;
        let mut hits: Vec<(i64, Hit)> = Vec::new();
        for path in files {
            let title = path.file_stem().unwrap_or_default().to_string_lossy().into_owned();
            let content = fs::read_to_string(&path).unwrap_or_default();
            let line = content.lines().find(|l| l.to_lowercase().contains(&needle));
            if line.is_none() && !title.to_lowercase().contains(&needle) {
                continue;
            }
            let snippet = line
                .or_else(|| content.lines().find(|l| !l.trim().is_empty()))
                .map(|l| truncate(l.trim(), 120))
                .unwrap_or_default();
            hits.push((modified_ms(&path), Hit { path: rel_string(&self.root, &path), title, snippet }));
        }
        hits.sort_by_key(|h| std::cmp::Reverse(h.0));
        Ok(hits.into_iter().take(50).map(|(_, h)| h).collect())
    }

    // ---- helpers ----

    /// Resolve a UI-supplied relative `.md` path to an absolute path inside the root.
    fn resolve(&self, rel: &str) -> Result<PathBuf, StoreError> {
        let rel = check_rel(rel, false)?;
        if rel.extension().is_none_or(|e| e != "md") {
            return Err(StoreError::InvalidPath);
        }
        let path = self.root.join(rel);
        self.check_no_escape(&path)?;
        Ok(path)
    }

    fn existing(&self, rel: &str) -> Result<PathBuf, StoreError> {
        let path = self.resolve(rel)?;
        if !path.is_file() {
            return Err(StoreError::NotFound);
        }
        Ok(path)
    }

    /// "" means the root; otherwise a folder path made of valid names.
    fn folder_dir(&self, folder: &str) -> Result<PathBuf, StoreError> {
        let folder = folder.trim().trim_matches('/');
        if folder.is_empty() {
            return Ok(self.root.clone());
        }
        let mut dir = self.root.clone();
        for part in folder.split('/') {
            dir.push(valid_name(part)?);
        }
        if dir == self.root.join(TRASH) {
            return Err(StoreError::InvalidName);
        }
        self.check_no_escape(&dir)?;
        Ok(dir)
    }

    /// Reject paths whose nearest existing ancestor resolves outside the root (symlinks).
    fn check_no_escape(&self, path: &Path) -> Result<(), StoreError> {
        let root = self.root.canonicalize()?;
        let mut probe = path;
        while !probe.exists() {
            probe = probe.parent().ok_or(StoreError::InvalidPath)?;
        }
        if probe.canonicalize()?.starts_with(&root) {
            Ok(())
        } else {
            Err(StoreError::InvalidPath)
        }
    }

    fn pages_in(&self, dir: &Path) -> Result<Vec<NoteMeta>, StoreError> {
        let mut out = Vec::new();
        let entries = match fs::read_dir(dir) {
            Ok(e) => e,
            Err(e) if e.kind() == io::ErrorKind::NotFound => return Ok(out),
            Err(e) => return Err(e.into()),
        };
        for entry in entries.flatten() {
            let path = entry.path();
            if is_page(&path) {
                out.push(self.meta(&path)?);
            }
        }
        Ok(out)
    }

    fn meta(&self, path: &Path) -> Result<NoteMeta, StoreError> {
        let rel = rel_string(&self.root, path);
        let folder = match rel.rfind('/') {
            Some(i) => rel[..i].to_string(),
            None => String::new(),
        };
        let content = fs::read_to_string(path)?;
        Ok(NoteMeta {
            title: path.file_stem().unwrap_or_default().to_string_lossy().into_owned(),
            folder,
            modified: modified_ms(path),
            preview: truncate(content.trim(), 200),
            path: rel,
        })
    }
}

/// Validate a relative path: only normal components, no hidden ones unless `allow_trash`.
fn check_rel(rel: &str, allow_trash: bool) -> Result<PathBuf, StoreError> {
    if rel.is_empty() || rel.starts_with('/') || rel.starts_with('\\') || rel.contains('\\') {
        return Err(StoreError::InvalidPath);
    }
    let mut out = PathBuf::new();
    for (i, part) in rel.split('/').enumerate() {
        let hidden_ok = allow_trash && i == 0 && part == TRASH;
        if part.is_empty() || part == "." || part == ".." || part.contains(':') {
            return Err(StoreError::InvalidPath);
        }
        if part.starts_with('.') && !hidden_ok {
            return Err(StoreError::InvalidPath);
        }
        out.push(part);
    }
    Ok(out)
}

/// A file or folder name typed by the user.
fn valid_name(name: &str) -> Result<&str, StoreError> {
    let name = name.trim();
    let bad = |c: char| matches!(c, '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || c.is_control();
    if name.is_empty() || name.starts_with('.') || name.chars().any(bad) || name.len() > 200 {
        return Err(StoreError::InvalidName);
    }
    Ok(name)
}

/// A file-name-safe title from the first non-empty line: Markdown markers and characters
/// not allowed in file names are dropped, and it is cut to 60 characters at a word boundary.
fn title_from_text(text: &str) -> Option<String> {
    let line = text.lines().map(str::trim).find(|l| !l.is_empty())?;
    // Drop leading Markdown block markers: "# ", "> ", "- ", "1. ", "[ ]", "[x]".
    let mut rest = line;
    loop {
        let mut next = rest.trim_start_matches(['#', '>', '-', '*', '+', ' ']);
        let digits = next.len() - next.trim_start_matches(|c: char| c.is_ascii_digit()).len();
        if digits > 0 && next[digits..].starts_with(['.', ')']) {
            next = next[digits + 1..].trim_start();
        }
        let next = ["[ ]", "[x]", "[X]"].iter().fold(next, |r, m| r.strip_prefix(m).unwrap_or(r));
        if next == rest {
            break;
        }
        rest = next;
    }
    let cleaned: String = rest
        .chars()
        .map(|c| if c.is_alphanumeric() || matches!(c, ' ' | '\'' | '(' | ')' | '&' | '+' | ',' | '!') { c } else { ' ' })
        .collect();
    let words: Vec<&str> = cleaned.split_whitespace().collect();
    let mut title = String::new();
    for w in words {
        if title.chars().count() + w.chars().count() + 1 > 60 {
            break;
        }
        if !title.is_empty() {
            title.push(' ');
        }
        title.push_str(w);
    }
    let title = title.trim_matches(|c: char| c == ',' || c == ' ').to_string();
    (!title.is_empty()).then_some(title)
}

/// `dir/stem.md`, or `dir/stem{sep}2.md`, `…3.md` if taken.
fn unique_path(dir: &Path, stem: &str, sep: &str) -> PathBuf {
    let first = dir.join(format!("{stem}.md"));
    if !first.exists() {
        return first;
    }
    (2..)
        .map(|n| dir.join(format!("{stem}{sep}{n}.md")))
        .find(|p| !p.exists())
        .expect("unbounded range")
}

/// Write to a temp file in the same folder, flush to disk, then rename over the target.
pub(crate) fn atomic_write(path: &Path, content: &str) -> io::Result<()> {
    let mut tmp = path.as_os_str().to_owned();
    tmp.push(".tmp");
    let tmp = PathBuf::from(tmp);
    {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(content.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(&tmp, path).inspect_err(|_| {
        let _ = fs::remove_file(&tmp);
    })
}

fn is_page(path: &Path) -> bool {
    path.is_file()
        && path.extension().is_some_and(|e| e == "md")
        && !path.file_name().unwrap_or_default().to_string_lossy().starts_with('.')
}

fn is_hidden(path: &Path) -> bool {
    path.file_name().unwrap_or_default().to_string_lossy().starts_with('.')
}

fn collect_dirs(dir: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in fs::read_dir(dir)?.flatten() {
        let path = entry.path();
        // file_type() does not follow symlinks: skips links out of the root and loops.
        let is_dir = entry.file_type().is_ok_and(|t| t.is_dir());
        if is_dir && !is_hidden(&path) {
            out.push(path.clone());
            collect_dirs(&path, out)?;
        }
    }
    Ok(())
}

fn collect_md(dir: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in fs::read_dir(dir)?.flatten() {
        let path = entry.path();
        // file_type() does not follow symlinks: skips links out of the root and loops.
        let is_dir = entry.file_type().is_ok_and(|t| t.is_dir());
        if is_dir && !is_hidden(&path) {
            collect_md(&path, out)?;
        } else if is_page(&path) {
            out.push(path);
        }
    }
    Ok(())
}

fn sort_pages(pages: &mut [NoteMeta]) {
    pages.sort_by_key(|p| p.title.to_lowercase());
}

fn rel_string(root: &Path, path: &Path) -> String {
    let rel = path.strip_prefix(root).unwrap_or(path);
    rel.components()
        .map(|c| c.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/")
}

fn modified_ms(path: &Path) -> i64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map_or(0, |d| d.as_millis() as i64)
}

fn truncate(s: &str, max_chars: usize) -> String {
    match s.char_indices().nth(max_chars) {
        Some((i, _)) => format!("{}…", &s[..i]),
        None => s.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;
    use std::fs;

    fn store() -> (tempfile::TempDir, Store) {
        let dir = tempfile::tempdir().unwrap();
        let s = Store::new(dir.path().to_path_buf());
        s.ensure().unwrap();
        (dir, s)
    }

    fn at(h: u32, m: u32, sec: u32) -> NaiveDateTime {
        NaiveDate::from_ymd_opt(2026, 10, 19).unwrap().and_hms_opt(h, m, sec).unwrap()
    }

    #[test]
    fn add_inbox_writes_timestamped_file() {
        let (_d, s) = store();
        let meta = s.add_inbox("step motor idea", at(14, 32, 5)).unwrap();
        assert_eq!(meta.path, "Inbox/2026-10-19-143205.md");
        assert_eq!(meta.folder, "Inbox");
        assert_eq!(s.read(&meta.path).unwrap(), "step motor idea\n");
    }

    #[test]
    fn add_inbox_same_second_gets_suffix() {
        let (_d, s) = store();
        s.add_inbox("one", at(14, 32, 5)).unwrap();
        let second = s.add_inbox("two", at(14, 32, 5)).unwrap();
        assert_eq!(second.path, "Inbox/2026-10-19-143205-2.md");
    }

    #[test]
    fn add_inbox_rejects_blank() {
        let (_d, s) = store();
        assert!(matches!(s.add_inbox("  \n\t ", at(1, 2, 3)), Err(StoreError::Empty)));
    }

    #[test]
    fn list_inbox_newest_first_with_preview() {
        let (_d, s) = store();
        s.add_inbox("older", at(10, 0, 0)).unwrap();
        s.add_inbox("newer\nsecond line", at(11, 0, 0)).unwrap();
        let items = s.list_inbox().unwrap();
        assert_eq!(items.len(), 2);
        assert_eq!(items[0].path, "Inbox/2026-10-19-110000.md");
        assert_eq!(items[0].preview, "newer\nsecond line");
    }

    #[test]
    fn write_is_atomic_and_round_trips() {
        let (d, s) = store();
        s.write("Ideas/a.md", "# A\nbody").unwrap();
        assert_eq!(s.read("Ideas/a.md").unwrap(), "# A\nbody");
        let leftovers: Vec<_> = fs::read_dir(d.path().join("Ideas"))
            .unwrap()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_name().to_string_lossy().ends_with(".tmp"))
            .collect();
        assert!(leftovers.is_empty());
    }

    #[test]
    fn rejects_paths_outside_root() {
        let (_d, s) = store();
        assert!(matches!(s.read("../x.md"), Err(StoreError::InvalidPath)));
        assert!(matches!(s.read("/etc/passwd"), Err(StoreError::InvalidPath)));
        assert!(matches!(s.write("a/../../x.md", "x"), Err(StoreError::InvalidPath)));
        assert!(matches!(s.write("Ideas/notes.txt", "x"), Err(StoreError::InvalidPath)));
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escape() {
        let (d, s) = store();
        let outside = tempfile::tempdir().unwrap();
        std::os::unix::fs::symlink(outside.path(), d.path().join("Link")).unwrap();
        assert!(matches!(s.write("Link/evil.md", "x"), Err(StoreError::InvalidPath)));
        assert!(!outside.path().join("evil.md").exists());
    }

    #[test]
    fn read_missing_is_not_found() {
        let (_d, s) = store();
        assert!(matches!(s.read("nope.md"), Err(StoreError::NotFound)));
    }

    #[test]
    fn create_page_and_duplicate_suffix() {
        let (_d, s) = store();
        let a = s.create_page("Ideas", "Robot arm").unwrap();
        assert_eq!(a.path, "Ideas/Robot arm.md");
        assert_eq!(a.title, "Robot arm");
        let b = s.create_page("Ideas", "Robot arm").unwrap();
        assert_eq!(b.path, "Ideas/Robot arm 2.md");
        let root = s.create_page("", "Top").unwrap();
        assert_eq!(root.path, "Top.md");
        assert_eq!(root.folder, "");
    }

    #[test]
    fn create_page_rejects_bad_titles() {
        let (_d, s) = store();
        assert!(matches!(s.create_page("Ideas", "a/b"), Err(StoreError::InvalidName)));
        assert!(matches!(s.create_page("Ideas", "a\\b"), Err(StoreError::InvalidName)));
        assert!(matches!(s.create_page("Ideas", "  "), Err(StoreError::InvalidName)));
        assert!(matches!(s.create_page("Ideas", ".hidden"), Err(StoreError::InvalidName)));
        assert!(matches!(s.create_page("../up", "x"), Err(StoreError::InvalidName)));
    }

    #[test]
    fn tree_sorted_and_filtered() {
        let (d, s) = store();
        s.create_page("Work", "Meeting").unwrap();
        s.create_page("Ideas", "b").unwrap();
        s.create_page("Ideas", "A").unwrap();
        s.create_page("", "Loose").unwrap();
        s.create_folder("Empty").unwrap();
        s.add_inbox("x", at(1, 1, 1)).unwrap();
        fs::write(d.path().join("Ideas/readme.txt"), "x").unwrap();
        fs::create_dir_all(d.path().join(".trash")).unwrap();
        fs::create_dir_all(d.path().join(".git")).unwrap();
        let t = s.tree().unwrap();
        let names: Vec<_> = t.folders.iter().map(|f| f.name.as_str()).collect();
        assert_eq!(names, ["Empty", "Ideas", "Work"]);
        let ideas: Vec<_> = t.folders[1].pages.iter().map(|p| p.title.as_str()).collect();
        assert_eq!(ideas, ["A", "b"]);
        assert_eq!(t.root_pages.len(), 1);
        assert_eq!(t.root_pages[0].title, "Loose");
    }

    #[test]
    fn rename_and_move() {
        let (_d, s) = store();
        let p = s.create_page("Ideas", "Old").unwrap();
        s.write(&p.path, "body").unwrap();
        let r = s.rename(&p.path, "New").unwrap();
        assert_eq!(r.path, "Ideas/New.md");
        assert_eq!(s.read("Ideas/New.md").unwrap(), "body");
        s.create_page("Work", "New").unwrap();
        let m = s.move_to(&r.path, "Work").unwrap();
        assert_eq!(m.path, "Work/New 2.md");
        assert!(matches!(s.read("Ideas/New.md"), Err(StoreError::NotFound)));
    }

    #[test]
    fn move_inbox_note_into_new_folder() {
        let (_d, s) = store();
        let n = s.add_inbox("idea", at(9, 0, 0)).unwrap();
        let m = s.move_to(&n.path, "Ideas").unwrap();
        assert_eq!(m.path, "Ideas/idea.md");
        assert!(s.list_inbox().unwrap().is_empty());
    }

    #[test]
    fn moving_inbox_note_titles_it_from_first_line() {
        let (_d, s) = store();
        let n = s.add_inbox("- [ ] Use a *step* motor: base/arm?\nmore", at(9, 0, 0)).unwrap();
        let m = s.move_to(&n.path, "Ideas").unwrap();
        assert_eq!(m.path, "Ideas/Use a step motor base arm.md");
        let long = "word ".repeat(30);
        let n = s.add_inbox(&long, at(9, 0, 1)).unwrap();
        let m = s.move_to(&n.path, "Ideas").unwrap();
        assert!(m.title.chars().count() <= 60, "{}", m.title);
        assert!(!m.title.ends_with(' '));
        let n = s.add_inbox("### ***", at(9, 0, 2)).unwrap();
        let m = s.move_to(&n.path, "Ideas").unwrap();
        assert_eq!(m.title, "2026-10-19-090002");
    }

    #[test]
    fn title_from_text_cases() {
        assert_eq!(title_from_text("# Robot arm\nbody"), Some("Robot arm".into()));
        assert_eq!(title_from_text("\n\n  > quoted: idea  "), Some("quoted idea".into()));
        assert_eq!(title_from_text(".hidden"), Some("hidden".into()));
        assert_eq!(title_from_text("   "), None);
        assert_eq!(title_from_text("3D printer idea"), Some("3D printer idea".into()));
        assert_eq!(title_from_text("2. second step"), Some("second step".into()));
    }

    #[test]
    fn trash_and_restore() {
        let (_d, s) = store();
        let p = s.create_page("Ideas", "Gone").unwrap();
        let t = s.trash(&p.path).unwrap();
        assert!(t.starts_with(".trash/"));
        assert!(matches!(s.read(&p.path), Err(StoreError::NotFound)));
        s.restore(&t, &p.path).unwrap();
        assert!(s.read(&p.path).is_ok());
    }

    #[test]
    fn search_case_insensitive_with_snippet() {
        let (_d, s) = store();
        s.write("Ideas/Robot.md", "# Robot\nuse a Step Motor here").unwrap();
        s.write("Work/Other.md", "nothing").unwrap();
        s.add_inbox("step by step", at(2, 0, 0)).unwrap();
        let hits = s.search("STEP").unwrap();
        assert_eq!(hits.len(), 2);
        let robot = hits.iter().find(|h| h.title == "Robot").unwrap();
        assert!(robot.snippet.contains("Step Motor"));
    }

    #[test]
    fn search_matches_title_and_limits() {
        let (_d, s) = store();
        for i in 0..60 {
            s.write(&format!("Many/n{i}.md"), "needle").unwrap();
        }
        s.write("Ideas/Needle title.md", "").unwrap();
        let hits = s.search("needle").unwrap();
        assert_eq!(hits.len(), 50);
        assert!(s.search("title").unwrap().iter().any(|h| h.title == "Needle title"));
        assert!(s.search("  ").unwrap().is_empty());
    }
}
