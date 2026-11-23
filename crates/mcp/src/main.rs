// Temporary stub (Task 8 replaces this file with the server): nothing calls the notebook yet.
// `expect` rather than `allow`, so the build reminds us to drop it once the server uses it.
#[expect(dead_code, reason = "the MCP server that calls the notebook arrives in Task 8")]
mod notebook;

fn main() {}
