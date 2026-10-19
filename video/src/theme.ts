import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** Light-mode tokens of the app, as in src/lib/theme.css. */
export const colors = {
  /** Background of the video around the windows. */
  page: "#e9ecf1",
  paper: "#f7f8fa",
  sheet: "#ffffff",
  side: "#eef0f4",
  graphite: "#23262b",
  muted: "#6c717a",
  line: "#dfe3e9",
  ink: "#2f5bd3",
  inkSoft: "#e4ebfb",
  cardRule: "#e0475b",
  ok: "#1f8a5b",
  /** The desktop behind the quick box, as in the quick box screenshots. */
  desktop: "#282c34",
  /** Terminal text and its prompt, on graphite. */
  terminal: "#e6e8ec",
  prompt: "#8ca8ff",
} as const;

/** The app's two typefaces: the interface, and the writing font of notes and pages. */
export const fontFamily = "Atkinson Hyperlegible Next";
export const writerFamily = "iA Writer Quattro";

// The same variable font as the app, in its two subsets: Latin, and Latin Extended for ğ, ş and İ.
loadFont({
  family: fontFamily,
  url: staticFile("fonts/atkinson.woff2"),
  weight: "200 800",
  unicodeRange:
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
});
loadFont({
  family: fontFamily,
  url: staticFile("fonts/atkinson-ext.woff2"),
  weight: "200 800",
  unicodeRange:
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
});
// iA Writer Quattro S (Latin with Turkish letters), as bundled by the app.
loadFont({ family: writerFamily, url: staticFile("fonts/quattro-400.woff2"), weight: "400" });
loadFont({ family: writerFamily, url: staticFile("fonts/quattro-700.woff2"), weight: "700" });
loadFont({ family: writerFamily, url: staticFile("fonts/quattro-400-italic.woff2"), weight: "400", style: "italic" });

/** Shared extrapolation for interpolate() calls that should hold their end values. */
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
