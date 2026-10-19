// Tauri has no Node server: render in the webview only, and prerender one HTML shell
// per route (quick.html, notebook.html) so each window can load its own URL.
export const ssr = false;
export const prerender = true;
