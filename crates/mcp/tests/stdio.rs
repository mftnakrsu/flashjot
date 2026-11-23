//! Starts the built flashjot-mcp and talks to it the way an MCP client does: JSON-RPC
//! messages, one per line, over stdin and stdout.

use serde_json::{Value, json};
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError};
use std::time::{Duration, Instant};

/// How long a request may wait for its reply before the test fails.
const REPLY_TIMEOUT: Duration = Duration::from_secs(10);

struct Client {
    child: Child,
    stdin: ChildStdin,
    /// Lines the server printed, read on their own thread so a silent server can time out.
    lines: Receiver<String>,
    next_id: u64,
}

impl Client {
    fn start(notes: &std::path::Path) -> Client {
        let mut child = Command::new(env!("CARGO_BIN_EXE_flashjot-mcp"))
            .arg("--notes-dir")
            .arg(notes)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null())
            .spawn()
            .unwrap();
        let stdin = child.stdin.take().unwrap();
        let stdout = BufReader::new(child.stdout.take().unwrap());
        let (tx, lines) = mpsc::channel();
        std::thread::spawn(move || {
            for line in stdout.lines().map_while(Result::ok) {
                if tx.send(line).is_err() {
                    break;
                }
            }
        });
        Client { child, stdin, lines, next_id: 1 }
    }

    fn send(&mut self, msg: Value) {
        writeln!(self.stdin, "{msg}").unwrap();
        self.stdin.flush().unwrap();
    }

    fn request(&mut self, method: &str, params: Value) -> Value {
        let id = self.next_id;
        self.next_id += 1;
        self.send(json!({ "jsonrpc": "2.0", "id": id, "method": method, "params": params }));
        let deadline = Instant::now() + REPLY_TIMEOUT;
        loop {
            let line = match self.lines.recv_timeout(deadline.saturating_duration_since(Instant::now())) {
                Ok(line) => line,
                Err(RecvTimeoutError::Timeout) => panic!("no reply to {method} (id {id}) within {REPLY_TIMEOUT:?}"),
                Err(RecvTimeoutError::Disconnected) => panic!("server closed stdout"),
            };
            let msg: Value = serde_json::from_str(&line).unwrap();
            if msg["id"] == id {
                return msg;
            }
        }
    }

    fn call(&mut self, tool: &str, arguments: Value) -> Value {
        self.request("tools/call", json!({ "name": tool, "arguments": arguments }))["result"].clone()
    }
}

impl Drop for Client {
    fn drop(&mut self) {
        let _ = self.child.kill();
    }
}

fn text(result: &Value) -> &str {
    result["content"][0]["text"].as_str().unwrap()
}

#[test]
fn an_mcp_client_can_capture_and_read_notes() {
    let d = tempfile::tempdir().unwrap();
    let notes = d.path().join("notes");
    let mut c = Client::start(&notes);

    let init = c.request(
        "initialize",
        json!({ "protocolVersion": "2025-11-25", "capabilities": {}, "clientInfo": { "name": "test", "version": "0" } }),
    );
    assert_eq!(init["result"]["serverInfo"]["name"], "flashjot-mcp");
    assert!(init["result"]["instructions"].as_str().unwrap().contains("read-note first"));
    c.send(json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }));

    let tools = c.request("tools/list", json!({}));
    let mut names: Vec<&str> = tools["result"]["tools"].as_array().unwrap().iter().map(|t| t["name"].as_str().unwrap()).collect();
    names.sort();
    assert_eq!(
        names,
        [
            "capture", "create-folder", "create-page", "list-inbox", "list-notebook", "move-note", "open-tasks",
            "read-note", "rename-note", "restore-note", "search", "set-task", "trash-note", "write-note"
        ]
    );

    let captured = c.call("capture", json!({ "notes": ["buy a new lamp"] }));
    assert_eq!(captured["isError"], false);
    let saved: Value = serde_json::from_str(text(&captured)).unwrap();
    let path = saved[0]["path"].as_str().unwrap().to_string();
    assert!(path.starts_with("Inbox/"));
    assert_eq!(std::fs::read_to_string(notes.join(&path)).unwrap(), "buy a new lamp\n");

    let read = c.call("read-note", json!({ "path": path }));
    let note: Value = serde_json::from_str(text(&read)).unwrap();
    assert_eq!(note["content"], "buy a new lamp\n");

    let stale = c.call("write-note", json!({ "path": path, "content": "x", "modified": 1 }));
    assert_eq!(stale["isError"], true);
    assert!(text(&stale).contains("changed since it was read"));

    let missing = c.call("read-note", json!({ "path": "../outside.md" }));
    assert_eq!(missing["isError"], true);
}
