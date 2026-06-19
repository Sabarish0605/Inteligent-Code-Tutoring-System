"use client";

import dynamic from "next/dynamic";
import { DEFAULT_JAVA_CODE } from "@/lib/constants";

// Re-export so any legacy imports still work
export { DEFAULT_JAVA_CODE };

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

/** Map file extension → Monaco language id */
export function getMonacoLanguage(filename: string): string {
  if (filename.endsWith(".java")) return "java";
  if (filename.endsWith(".md")) return "markdown";
  if (filename.endsWith(".json")) return "json";
  if (filename.endsWith(".js")) return "javascript";
  if (filename.endsWith(".ts")) return "typescript";
  if (filename.endsWith(".py")) return "python";
  if (filename.endsWith(".txt")) return "plaintext";
  return "plaintext";
}

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
  /** Monaco language id — inferred from filename if omitted */
  language?: string;
}

export default function EditorPanel({
  code,
  onChange,
  language = "java",
}: EditorPanelProps) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1d1c2b" }}>
      <MonacoEditor
        height="100%"
        language={language}
        value={code}
        theme="spell-dark"
        onChange={(val) => onChange(val ?? "")}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          lineHeight: 22,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "line",
          cursorBlinking: "phase",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          wordWrap: language === "markdown" ? "on" : "off",
        }}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("spell-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "keyword", foreground: "ff5370", fontStyle: "bold" },
              { token: "string", foreground: "c3e88d" },
              { token: "comment", foreground: "546e7a", fontStyle: "italic" },
              { token: "number", foreground: "f78c6c" },
              { token: "type", foreground: "decb6b" },
              { token: "identifier", foreground: "a5a6c5" },
            ],
            colors: {
              "editor.background": "#1d1c2b",
              "editor.foreground": "#a5a6c5",
              "editor.lineHighlightBackground": "#252438",
              "editorLineNumber.foreground": "#4c4f69",
              "editorLineNumber.activeForeground": "#a78bfa",
              "editor.selectionBackground": "#a78bfa33",
              "editor.inactiveSelectionBackground": "#a78bfa11",
              "editorCursor.foreground": "#00e5ff",
              "editorGutter.background": "#1d1c2b",
              "minimap.background": "#1d1c2b",
            },
          });
          monaco.editor.setTheme("spell-dark");
        }}
        onMount={(editorInstance, monaco) => {
          monaco.editor.setTheme("spell-dark");
          editorInstance.getContainerDomNode().style.background = "#1d1c2b";
          editorInstance.focus();

          // Bind Ctrl+Enter to trigger execution event
          editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            window.dispatchEvent(new CustomEvent("spell-run-code"));
          });

          // Bind F5 to trigger execution event
          editorInstance.addCommand(monaco.KeyCode.F5, () => {
            window.dispatchEvent(new CustomEvent("spell-run-code"));
          });
        }}
      />
    </div>
  );
}
