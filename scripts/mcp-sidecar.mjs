// Builds flashjot-mcp for one target and copies it to src-tauri/binaries/ under the name Tauri's
// externalBin expects (flashjot-mcp-<target triple>[.exe]). Usage: node scripts/mcp-sidecar.mjs [triple]
// It always builds with --target, so its output never shares a folder with the app's own build,
// where tauri-build copies the sidecar under the plain name flashjot-mcp.
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";

const host = execFileSync("rustc", ["-vV"]).toString().match(/^host: (.+)$/m)[1];
const target = process.argv[2] || host;
const ext = target.includes("windows") ? ".exe" : "";

execFileSync("cargo", ["build", "--release", "-p", "flashjot-mcp", "--target", target], { stdio: "inherit" });
mkdirSync("src-tauri/binaries", { recursive: true });
copyFileSync(`target/${target}/release/flashjot-mcp${ext}`, `src-tauri/binaries/flashjot-mcp-${target}${ext}`);
console.log(`src-tauri/binaries/flashjot-mcp-${target}${ext}`);
