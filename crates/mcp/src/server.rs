//! The MCP side: tool definitions and replies. Each tool calls one `Notebook` method.

use crate::notebook::{Notebook, ToolError};
use rmcp::handler::server::router::tool::ToolRouter;
use rmcp::handler::server::wrapper::Parameters;
use rmcp::model::{CallToolResult, ContentBlock, Implementation, ServerCapabilities, ServerConfig};
use rmcp::{ErrorData as McpError, ServerHandler, schemars, tool, tool_handler, tool_router};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Clone)]
pub struct Server {
    nb: Arc<Notebook>,
    #[allow(dead_code, reason = "read by the code tool_handler generates")]
    tool_router: ToolRouter<Self>,
}

/// JSON for a result, or the message as a tool error the agent can act on.
fn reply<T: Serialize>(result: Result<T, ToolError>) -> Result<CallToolResult, McpError> {
    match result {
        Ok(value) => Ok(CallToolResult::success(vec![ContentBlock::json(value)?])),
        Err(ToolError(message)) => Ok(CallToolResult::error(vec![ContentBlock::text(message)])),
    }
}

fn done(result: Result<(), ToolError>) -> Result<CallToolResult, McpError> {
    reply(result.map(|()| serde_json::json!({ "ok": true })))
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct CaptureArgs {
    /// 1 to 20 notes. Each is saved on its own. A note starting with "[]" adds its lines as tasks to the Tasks page.
    pub notes: Vec<String>,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct PathArgs {
    /// Path of the note inside the notebook, '/'-separated, ending in .md, as list-notebook, list-inbox or search return it.
    pub path: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct SearchArgs {
    /// Text to look for in titles and note text (case-insensitive).
    pub query: String,
    /// How many hits to return, 1 to 50. Default 20.
    pub limit: Option<usize>,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct SetTaskArgs {
    /// Page holding the task, as open-tasks returns it.
    pub path: String,
    /// The task's 0-based line, as open-tasks returns it.
    pub line: usize,
    /// The task's text, exactly as open-tasks returns it.
    pub text: String,
    /// true ticks the task, false unticks it.
    pub done: bool,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct WriteArgs {
    /// Path of an existing note.
    pub path: String,
    /// The whole new content of the note (Markdown).
    pub content: String,
    /// `modified` exactly as read-note returned it.
    pub modified: i64,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct FolderArgs {
    /// Folder name; "Parent/Child" makes nested folders.
    pub name: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct CreatePageArgs {
    /// Folder for the page, "" for the notebook's root. Created if missing.
    pub folder: String,
    /// Page title; it becomes the file name.
    pub title: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct RenameArgs {
    /// Path of the note.
    pub path: String,
    /// New title (the file name without .md).
    pub title: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
pub struct MoveArgs {
    /// Path of the note.
    pub path: String,
    /// Target folder, "" for the root. Inbox notes moved out get a title from their first line.
    pub folder: String,
}

#[derive(Deserialize, schemars::JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct RestoreArgs {
    /// `trashPath` as trash-note returned it.
    pub trash_path: String,
    /// `originalPath` as trash-note returned it.
    pub original_path: String,
}

#[tool_router]
impl Server {
    pub fn new(nb: Notebook) -> Self {
        Server { nb: Arc::new(nb), tool_router: Self::tool_router() }
    }

    #[tool(
        name = "capture",
        description = "Save quick notes to the Flashjot Inbox, or tasks to the Tasks page when a note starts with \"[]\". Returns each note's outcome.",
        annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false)
    )]
    async fn capture(&self, Parameters(args): Parameters<CaptureArgs>) -> Result<CallToolResult, McpError> {
        if args.notes.is_empty() || args.notes.len() > 20 {
            return reply::<()>(Err(ToolError("Give 1 to 20 notes.".into())));
        }
        let now = chrono::Local::now().naive_local();
        reply(Ok(self.nb.capture(&args.notes, now)))
    }

    #[tool(name = "list-inbox", description = "Inbox notes, newest first, with a short preview.", annotations(read_only_hint = true, open_world_hint = false))]
    async fn list_inbox(&self) -> Result<CallToolResult, McpError> {
        reply(self.nb.list_inbox())
    }

    #[tool(
        name = "list-notebook",
        description = "Markdown overview of the notebook: the Inbox count, root pages, and each folder with its pages (paths included).",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn list_notebook(&self) -> Result<CallToolResult, McpError> {
        match self.nb.overview() {
            Ok(md) => Ok(CallToolResult::success(vec![ContentBlock::text(md)])),
            Err(e) => reply::<()>(Err(e)),
        }
    }

    #[tool(
        name = "read-note",
        description = "A note's content and `modified` time. Pass `modified` back unchanged to write-note.",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn read_note(&self, Parameters(args): Parameters<PathArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.read(&args.path))
    }

    #[tool(name = "search", description = "Find notes whose title or text contains the query. Newest first.", annotations(read_only_hint = true, open_world_hint = false))]
    async fn search(&self, Parameters(args): Parameters<SearchArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.search(&args.query, args.limit.unwrap_or(20)))
    }

    #[tool(
        name = "open-tasks",
        description = "Every unchecked task, grouped by page (Tasks page first), with each task's 0-based line and text.",
        annotations(read_only_hint = true, open_world_hint = false)
    )]
    async fn open_tasks(&self) -> Result<CallToolResult, McpError> {
        reply(self.nb.open_tasks())
    }

    #[tool(
        name = "set-task",
        description = "Tick or untick one task. Refused if that line no longer holds this task; then call open-tasks again.",
        annotations(read_only_hint = false, destructive_hint = false, idempotent_hint = true, open_world_hint = false)
    )]
    async fn set_task(&self, Parameters(a): Parameters<SetTaskArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.set_task(&a.path, a.line, &a.text, a.done))
    }

    #[tool(
        name = "write-note",
        description = "Replace the whole content of an existing note. Call read-note first and pass `modified` exactly as it returned it; refused if the note changed since.",
        annotations(read_only_hint = false, destructive_hint = true, open_world_hint = false)
    )]
    async fn write_note(&self, Parameters(a): Parameters<WriteArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.write(&a.path, &a.content, a.modified).map(|modified| serde_json::json!({ "modified": modified })))
    }

    #[tool(name = "create-folder", description = "Create a folder (nested with \"Parent/Child\").", annotations(read_only_hint = false, destructive_hint = false, idempotent_hint = true, open_world_hint = false))]
    async fn create_folder(&self, Parameters(a): Parameters<FolderArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.create_folder(&a.name))
    }

    #[tool(name = "create-page", description = "Create an empty page; returns its path. Then use write-note to fill it.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn create_page(&self, Parameters(a): Parameters<CreatePageArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.create_page(&a.folder, &a.title))
    }

    #[tool(name = "rename-note", description = "Give a note a new title; returns its new path.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn rename_note(&self, Parameters(a): Parameters<RenameArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.rename(&a.path, &a.title))
    }

    #[tool(name = "move-note", description = "Move a note to another folder; returns its new path.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn move_note(&self, Parameters(a): Parameters<MoveArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.move_to(&a.path, &a.folder))
    }

    #[tool(
        name = "trash-note",
        description = "Move a note to the trash (recoverable). Returns trashPath and originalPath for restore-note.",
        annotations(read_only_hint = false, destructive_hint = true, open_world_hint = false)
    )]
    async fn trash_note(&self, Parameters(a): Parameters<PathArgs>) -> Result<CallToolResult, McpError> {
        reply(self.nb.trash(&a.path))
    }

    #[tool(name = "restore-note", description = "Bring a trashed note back to where it was.", annotations(read_only_hint = false, destructive_hint = false, open_world_hint = false))]
    async fn restore_note(&self, Parameters(a): Parameters<RestoreArgs>) -> Result<CallToolResult, McpError> {
        done(self.nb.restore(&a.trash_path, &a.original_path))
    }
}

#[tool_handler]
impl ServerHandler for Server {
    fn get_info(&self) -> ServerConfig {
        ServerConfig::new(ServerCapabilities::builder().enable_tools().build())
            .with_server_info(Implementation::new("flashjot-mcp", env!("CARGO_PKG_VERSION")))
            .with_instructions(include_str!("instructions.md"))
    }
}
