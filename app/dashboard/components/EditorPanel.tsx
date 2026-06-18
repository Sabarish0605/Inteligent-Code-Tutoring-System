"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SPELL IDE!");
        
        // Try editing me and hitting RUN_CODE above
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum 1–10 = " + sum);
    }
}`;

interface EditorPanelProps {
  code: string;
  onChange: (value: string) => void;
}

export default function EditorPanel({ code, onChange }: EditorPanelProps) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#1d1c2b" }}>
      <MonacoEditor
        height="100%"
        language="java"
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
        }}
      />
    </div>
  );
}
