import type React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { copy, type Lang } from "../i18n";
import { clamp, colors } from "../theme";
import { typed } from "./Screen";

type FileTreeProps = {
  readonly lang: Lang;
  /** Font size; rows are 1.5 of it. */
  readonly fontSize: number;
  /** `tree` is typed from this frame; the output follows line by line. */
  readonly start: number;
};

/**
 * `tree` run in the notes folder, as a terminal shows it. The branch lines are drawn with borders
 * rather than box-drawing characters, so they line up in the app's own writing font.
 */
export const FileTree: React.FC<FileTreeProps> = ({ lang, fontSize, start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tree = copy[lang].tree;
  const command = "tree";
  const typedEnd = start + 0.35 * fps;
  const outputAt = typedEnd + 0.2 * fps;
  const row = fontSize * 1.5;
  const indent = fontSize * 1.6;
  const branch = { color: "#6c717a", width: Math.max(1.5, fontSize * 0.07) };
  const lineAt = (i: number) => outputAt + i * 2;
  const shown = (i: number) => interpolate(frame, [lineAt(i), lineAt(i) + 3], [0, 1], clamp);
  const entries = tree.entries;
  /** Does a vertical line continue through row `i` at `depth`? Yes while that branch has later siblings. */
  const continues = (i: number, depth: number) => {
    for (let j = i; j >= 0; j--) {
      if (entries[j].depth === depth) return !entries[j].last;
      if (entries[j].depth < depth) return false;
    }
    return false;
  };
  return (
    <div style={{ whiteSpace: "pre", lineHeight: `${row}px` }}>
      <div>
        <span style={{ color: colors.prompt }}>{tree.cwd} $ </span>
        {typed(command, frame, start, typedEnd)}
      </div>
      <div style={{ opacity: shown(0) }}>.</div>
      {entries.map((entry, i) => {
        const isFolder = entry.depth === 0;
        return (
          <div key={entry.name} style={{ position: "relative", height: row, opacity: shown(i + 1) }}>
            {/* Vertical lines of the ancestors that have more children below. */}
            {Array.from({ length: entry.depth }, (_, d) =>
              continues(i, d) ? (
                <div
                  key={d}
                  style={{ position: "absolute", left: fontSize * 0.3 + d * indent, top: 0, height: row, width: branch.width, backgroundColor: branch.color }}
                />
              ) : null,
            )}
            {/* This entry's own elbow: └ for the last child, ├ otherwise. */}
            <div
              style={{
                position: "absolute",
                left: fontSize * 0.3 + entry.depth * indent,
                top: 0,
                height: entry.last ? row / 2 : row,
                width: branch.width,
                backgroundColor: branch.color,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: fontSize * 0.3 + entry.depth * indent,
                top: row / 2,
                width: indent * 0.7,
                height: branch.width,
                backgroundColor: branch.color,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: (entry.depth + 1) * indent,
                top: 0,
                color: entry.isNew ? "#8ca8ff" : isFolder ? "#8ca8ff" : colors.terminal,
                fontWeight: isFolder || entry.isNew ? 700 : 400,
              }}
            >
              {entry.name}
              {isFolder ? "/" : null}
              {entry.isNew ? (
                <span
                  style={{
                    marginLeft: fontSize * 0.7,
                    padding: `0 ${fontSize * 0.4}px`,
                    borderRadius: fontSize * 0.3,
                    backgroundColor: colors.cardRule,
                    color: colors.sheet,
                    fontSize: fontSize * 0.7,
                    verticalAlign: "middle",
                    opacity: interpolate(frame, [lineAt(i) + 0.6 * fps, lineAt(i) + 0.8 * fps], [0, 1], clamp),
                  }}
                >
                  {tree.newLabel}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
