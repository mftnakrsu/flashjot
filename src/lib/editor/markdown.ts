// CodeMirror setup: Markdown with live styling, clickable task checkboxes, themed by CSS tokens.
import { EditorState, type Extension, type Range } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  drawSelection,
  keymap,
  placeholder,
  type DecorationSet,
  type ViewUpdate,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const highlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "1.6em", fontWeight: "700", lineHeight: "1.3" },
  { tag: tags.heading2, fontSize: "1.3em", fontWeight: "700" },
  { tag: tags.heading3, fontSize: "1.12em", fontWeight: "700" },
  { tag: [tags.heading4, tags.heading5, tags.heading6], fontWeight: "700" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--muted)" },
  { tag: tags.link, color: "var(--ink)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--ink)" },
  { tag: tags.monospace, background: "var(--ink-soft)", borderRadius: "3px" },
  { tag: tags.quote, color: "var(--muted)", fontStyle: "italic" },
  // The Markdown punctuation itself (#, **, -, >) stays visible but recedes.
  { tag: [tags.processingInstruction, tags.contentSeparator], color: "var(--muted)", opacity: "0.65" },
  { tag: tags.keyword, color: "var(--ink)" },
  { tag: [tags.string, tags.number], color: "var(--ok)" },
  { tag: tags.comment, color: "var(--muted)", fontStyle: "italic" },
]);

const theme = EditorView.theme({
  "&": { height: "100%", background: "transparent", color: "var(--graphite)" },
  "&.cm-focused": { outline: "none" },
  ".cm-scroller": {
    fontFamily: "var(--writer)",
    fontSize: "var(--step-1)",
    lineHeight: "1.7",
    overflow: "auto",
  },
  ".cm-content": { maxWidth: "70ch", padding: "8px 0 40vh", caretColor: "var(--ink)" },
  ".cm-line": { padding: "0" },
  ".cm-cursor": { borderLeftColor: "var(--ink)", borderLeftWidth: "2px" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    background: "var(--ink-soft) !important",
  },
  ".cm-placeholder": { color: "var(--muted)", opacity: "0.7" },
  ".fj-task": {
    width: "1em",
    height: "1em",
    margin: "0 0.35em 0 0",
    verticalAlign: "-0.15em",
    accentColor: "var(--ink)",
    cursor: "pointer",
  },
});

class TaskWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }
  eq(other: TaskWidget) {
    return other.checked === this.checked;
  }
  toDOM() {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.className = "fj-task";
    box.checked = this.checked;
    box.setAttribute("aria-label", this.checked ? "Done" : "To do");
    return box;
  }
  ignoreEvent() {
    return false;
  }
}

function taskDecorations(view: EditorView): DecorationSet {
  const widgets: Range<Decoration>[] = [];
  for (const { from, to } of view.visibleRanges) {
    syntaxTree(view.state).iterate({
      from,
      to,
      enter: (node) => {
        if (node.name !== "TaskMarker") return;
        const text = view.state.doc.sliceString(node.from, node.to);
        const checked = /\[[xX]\]/.test(text);
        widgets.push(Decoration.replace({ widget: new TaskWidget(checked) }).range(node.from, node.to));
      },
    });
  }
  return Decoration.set(widgets);
}

/** Renders `- [ ]` / `- [x]` as real checkboxes; clicking toggles the text. */
const taskCheckboxes = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = taskDecorations(view);
    }
    update(u: ViewUpdate) {
      if (u.docChanged || u.viewportChanged || syntaxTree(u.startState) !== syntaxTree(u.state)) {
        this.decorations = taskDecorations(u.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    eventHandlers: {
      mousedown: (e, view) => {
        const target = e.target as HTMLElement;
        if (!target.classList.contains("fj-task")) return false;
        const pos = view.posAtDOM(target);
        const text = view.state.doc.sliceString(pos, pos + 3);
        const next = /\[[xX]\]/.test(text) ? "[ ]" : "[x]";
        view.dispatch({ changes: { from: pos, to: pos + 3, insert: next } });
        e.preventDefault();
        return true;
      },
    },
  },
);

export function createEditorState(doc: string, opts: { placeholder: string; onChange: (doc: string) => void }): EditorState {
  const extensions: Extension[] = [
    history(),
    drawSelection(),
    keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    syntaxHighlighting(highlight),
    taskCheckboxes,
    EditorView.lineWrapping,
    EditorView.contentAttributes.of({ spellcheck: "true", "aria-label": "Note" }),
    placeholder(opts.placeholder),
    theme,
    EditorView.updateListener.of((u) => {
      if (u.docChanged) opts.onChange(u.state.doc.toString());
    }),
  ];
  return EditorState.create({ doc, extensions });
}
