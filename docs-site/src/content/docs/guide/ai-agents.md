---
title: Use with AI agents
description: Let Claude Code, Claude Desktop, Cursor and other MCP clients capture, read and organise your Flashjot notes.
---

Flashjot comes with `flashjot-mcp`, an [MCP](https://modelcontextprotocol.io) server. With it, an
AI agent can save a quick note to your Inbox, add tasks, search and read your notes, tick tasks,
and file, rename or trash pages, following the same rules as the app.

- It works whether or not Flashjot is open. When it is open, changes show within a second.
- It never deletes anything for good: trashed notes stay in the trash, as when you delete them.
- It never changes your settings.
- It refuses to overwrite a page you changed after the agent read it.

## Where the server is

| You installed | Path |
|---|---|
| `.deb` or `.rpm` | `/usr/bin/flashjot-mcp` |
| macOS app | `/Applications/Flashjot.app/Contents/MacOS/flashjot-mcp` |
| Windows (`.exe` installer) | `%LOCALAPPDATA%\Flashjot\flashjot-mcp.exe` |
| Windows (`.msi`) | `C:\Program Files\Flashjot\flashjot-mcp.exe` |
| AppImage, or no app | download `flashjot-mcp-…` for your system from the [latest release](https://github.com/mftnakrsu/flashjot/releases/latest) |

On macOS, open Flashjot once first, so the system allows its programs to run.

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

## Options

- `--notes-dir <folder>`: use another notes folder, for example an Obsidian vault.
- `--settings <file>`: read settings from another file.

Without options the server uses the notes folder chosen in Flashjot's Settings. If you change that
folder, restart the server (in most clients: restart the client).

## What the agent can do

| Tool | What it does |
|---|---|
| `capture` | Saves quick notes to the Inbox; a note starting with `[]` adds tasks to the Tasks page |
| `list-inbox`, `list-notebook` | Lists the Inbox, or every folder and page |
| `read-note`, `search` | Reads a page; searches titles and text |
| `open-tasks`, `set-task` | Lists unchecked tasks; ticks or unticks one |
| `write-note` | Replaces a page's text, only if you haven't changed it since the agent read it |
| `create-folder`, `create-page`, `rename-note`, `move-note` | Organises pages |
| `trash-note`, `restore-note` | Moves a page to the trash, or brings it back |
