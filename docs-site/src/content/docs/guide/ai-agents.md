---
title: Use with AI agents
description: Let Claude Code, Claude Desktop, Cursor and other MCP clients capture, read and organise your Flashjot notes.
---

Flashjot comes with `flashjot-mcp`, an [MCP](https://modelcontextprotocol.io) server. With it, an
AI agent can save a quick note to your Inbox, add tasks, search and read your notes, tick tasks,
and file, rename or trash pages, following the same rules as the app.

- It works whether or not Flashjot is open. When it is open, changes show within a second.
- It can't empty the trash. Pages it trashes stay there and, like any others, are removed for good
  30 days later.
- It never changes your settings.
- `write-note` replaces a page's text, and is refused if the page changed on disk since the agent
  read it. If you have unsaved typing in that page in Flashjot at that moment, your typing is kept
  as a new note in the Inbox.

## Where the server is

| You installed | Path |
|---|---|
| `.deb` or `.rpm` | `/usr/bin/flashjot-mcp` |
| macOS app | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` |
| Windows (`.exe` installer) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` |
| Windows (`.msi`) | `C:\Program Files\Flashjot\flashjot-mcp.exe` |
| AppImage, or no app | download `flashjot-mcp-…` for your system from the [latest release](https://github.com/mftnakrsu/flashjot/releases/latest) and unpack it |

On macOS, open Flashjot once first, so the system allows its programs to run. If you downloaded the
server on its own, allow it once in the folder you unpacked it to:

```bash
xattr -d com.apple.quarantine flashjot-mcp
```

## Claude Code

```bash
claude mcp add flashjot -- /usr/bin/flashjot-mcp
```

Use the path from the table for your system.

## Claude Desktop, Cursor and other clients

Add this to the client's MCP settings (for Claude Desktop: Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "flashjot": { "command": "/usr/bin/flashjot-mcp" }
  }
}
```

On Windows, write the full path with every `\` doubled. `%LOCALAPPDATA%` is not expanded inside
JSON, so put in your own user folder:

```json
{
  "mcpServers": {
    "flashjot": { "command": "C:\\Users\\<you>\\AppData\\Local\\Flashjot\\flashjot-mcp.exe" }
  }
}
```

## Options

- `--notes-dir <folder>`: use another notes folder, for example an Obsidian vault.
- `--settings <file>`: read settings from another file.

Without options the server uses the notes folder chosen in Flashjot's Settings. If you change that
folder, restart the server (in most clients: restart the client).

With `--notes-dir` and no `--settings`, the server doesn't read Flashjot's settings: the app's
language and its Tasks page are not used, and a new Tasks page is named in your system's language.

## What the agent can do

| Tool | What it does |
|---|---|
| `capture` | Saves quick notes to the Inbox; a note starting with `[]` adds tasks to the Tasks page |
| `list-inbox`, `list-notebook` | Lists the Inbox, or every folder and page |
| `read-note`, `search` | Reads a page; searches titles and text |
| `open-tasks`, `set-task` | Lists unchecked tasks; ticks or unticks one |
| `write-note` | Replaces a page's text; refused if the page changed on disk since the agent read it |
| `create-folder`, `create-page`, `rename-note`, `move-note` | Organises pages |
| `trash-note`, `restore-note` | Moves a page to the trash, or brings it back |
