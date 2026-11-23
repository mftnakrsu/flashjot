//! flashjot-mcp: an MCP server over stdio for a Flashjot notebook. MCP clients start it;
//! stdout carries only protocol messages, so everything else goes to stderr.

mod notebook;
mod server;

use rmcp::ServiceExt;
use std::path::PathBuf;

const USAGE: &str = "Usage: flashjot-mcp [--notes-dir <folder>] [--settings <settings.json>]

An MCP server (stdio) for Flashjot notes. Without options it uses the same notes folder as
the Flashjot app. Add it to Claude Code with:  claude mcp add flashjot -- flashjot-mcp";

struct Args {
    notes_dir: Option<PathBuf>,
    settings: Option<PathBuf>,
}

fn parse_args(mut args: impl Iterator<Item = String>) -> Result<Option<Args>, String> {
    let mut out = Args { notes_dir: None, settings: None };
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--notes-dir" => out.notes_dir = Some(args.next().ok_or("--notes-dir needs a folder")?.into()),
            "--settings" => out.settings = Some(args.next().ok_or("--settings needs a file")?.into()),
            "--help" | "-h" => return Ok(None),
            "--version" | "-V" => {
                println!("flashjot-mcp {}", env!("CARGO_PKG_VERSION"));
                std::process::exit(0);
            }
            other => return Err(format!("unknown option {other}")),
        }
    }
    Ok(Some(out))
}

#[tokio::main(flavor = "current_thread")]
async fn main() {
    let args = match parse_args(std::env::args().skip(1)) {
        Ok(Some(args)) => args,
        Ok(None) => {
            println!("{USAGE}");
            return;
        }
        Err(e) => {
            eprintln!("flashjot-mcp: {e}\n\n{USAGE}");
            std::process::exit(2);
        }
    };
    let nb = match notebook::Notebook::open(args.notes_dir, args.settings) {
        Ok(nb) => nb,
        Err(e) => {
            eprintln!("flashjot-mcp: notes folder: {e}");
            std::process::exit(1);
        }
    };
    eprintln!("flashjot-mcp: notes in {}", nb.root().display());
    let service = match server::Server::new(nb).serve(rmcp::transport::stdio()).await {
        Ok(service) => service,
        Err(e) => {
            eprintln!("flashjot-mcp: {e}");
            std::process::exit(1);
        }
    };
    if let Err(e) = service.waiting().await {
        eprintln!("flashjot-mcp: {e}");
    }
}
