"use client";

import { useEffect, useRef } from "react";

export type TerminalStatus = "idle" | "compiling" | "success" | "error";

interface TerminalPanelProps {
  output: string;
  status: TerminalStatus;
}

const THEME = {
  green: "#00ff66",
  cyan: "#00E5FF",
  amber: "#ffb300",
  red: "#ff3333",
} as const;

const STATUS_CONFIG: Record<
  TerminalStatus,
  { label: string; color: string; dot: string }
> = {
  idle: { label: "READY", color: "#555577", dot: "#555577" },
  compiling: { label: "COMPILING", color: THEME.amber, dot: THEME.amber },
  success: { label: "OK", color: THEME.green, dot: THEME.green },
  error: { label: "ERROR", color: THEME.red, dot: THEME.red },
};

function lineColor(line: string, status: TerminalStatus): string {
  if (status === "success") return THEME.green;
  if (status === "error") {
    const lower = line.toLowerCase();
    if (
      lower.includes("error") ||
      lower.includes("exception") ||
      lower.includes("failed")
    ) {
      return THEME.red;
    }
    return THEME.amber;
  }
  if (status === "compiling") return THEME.amber;
  return "#aaaacc";
}

export default function TerminalPanel({ output, status }: TerminalPanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const cfg = STATUS_CONFIG[status];
  const lines = output ? output.split("\n") : [];

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [output]);

  return (
    <div
      style={{
        background: "#13121e",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 14px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          background: "#100f1c",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: cfg.dot,
            boxShadow: `0 0 6px ${cfg.dot}`,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: THEME.cyan,
            fontSize: 10,
            letterSpacing: "0.2em",
            opacity: 0.6,
          }}
        >
          CONSOLE_OUTPUT
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: cfg.color,
            fontSize: 10,
            letterSpacing: "0.15em",
          }}
        >
          [{cfg.label}]
        </span>
      </div>

      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        {lines.length === 0 ? (
          <p
            style={{
              color: "#4c4f69",
              fontSize: 12,
              margin: 0,
              letterSpacing: "0.05em",
            }}
          >
            Awaiting execution... Press F5 or Ctrl+Enter to run.
          </p>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                lineHeight: "20px",
                color: lineColor(line, status),
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {i === 0 && (
                <span style={{ color: THEME.green, marginRight: 8 }}>$</span>
              )}
              {line}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
