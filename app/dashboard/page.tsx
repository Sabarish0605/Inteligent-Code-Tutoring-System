"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import TerminalPanel, { TerminalStatus } from "./components/TerminalPanel";
import { executeJavaCodeViaJudge0 } from "@/lib/judge0";
import { getMonacoLanguage } from "./components/EditorPanel";
import { useVFSStore } from "@/lib/store/vfsStore";
import { loadVFS, saveVFS } from "@/lib/supabaseVFS";
import { supabase } from "@/lib/supabaseClient";

// Dynamic imports (SSR-safe)
const EditorPanel = dynamic(() => import("./components/EditorPanel"), {
  ssr: false,
});
const FileTree = dynamic(() => import("./components/FileTree"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        padding: "12px 16px",
        color: "#4c4f69",
        fontSize: 11,
      }}
    >
      Loading explorer...
    </div>
  ),
});

// ─── Theme ────────────────────────────────────────────────────────────────────

const THEME = {
  bg: "#020204",
  green: "#00ff66",
  cyan: "#00E5FF",
  amber: "#ffb300",
} as const;

// ─── Static mentor content ────────────────────────────────────────────────────

const MENTOR_HINTS = [
  "What does `System.out.println()` actually do under the hood?",
  "Can you explain the difference between `int` and `Integer` in Java?",
  "What would happen if your loop started at 0 instead of 1?",
];

const SOCRATIC_NUDGE =
  "I notice you've hit a few compilation errors. Let's slow down — what line is the compiler pointing at, and what do you think it's trying to tell you?";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // VFS store
  const {
    nodes,
    activeFileId,
    isDirty,
    autoSaveEnabled,
    getActiveFile,
    getFileNodes,
    getOpenFiles,
    setActiveFile,
    closeFile,
    updateFileContent,
    loadNodes,
    markClean,
  } = useVFSStore();

  const activeFile = getActiveFile();
  const fileNodes = getOpenFiles();

  // Session / persistence
  const [userId, setUserId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );

  // Terminal / execution
  const [output, setOutput] = useState("");
  const [termStatus, setTermStatus] = useState<TerminalStatus>("idle");
  const [isRunning, setIsRunning] = useState(false);

  // Mentor panel
  const [mentorInput, setMentorInput] = useState("");
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [showLightbulb, setShowLightbulb] = useState(false);
  const [mentorRevealed, setMentorRevealed] = useState(false);

  const errorStreakRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── On mount: resolve session then hydrate VFS ─────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        loadVFS(uid).then((remoteNodes) => {
          if (remoteNodes && remoteNodes.length > 0) {
            loadNodes(remoteNodes);
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Debounced Supabase save ────────────────────────────────────────────────

  useEffect(() => {
    if (!isDirty || !userId || !autoSaveEnabled) return;

    setSaveStatus("saving");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveVFS(userId, nodes);
      markClean();
      setSaveStatus("saved");
      // Clear "saved" label after 2 s
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 2000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, isDirty, userId]);

  // ── Run code ──────────────────────────────────────────────────────────────

  const handleRunCode = useCallback(async () => {
    const file = useVFSStore.getState().getActiveFile();
    if (!file) return;

    setIsRunning(true);
    setTermStatus("compiling");
    setOutput(`Compiling ${file.name} via Judge0 API...`);

    try {
      const result = await executeJavaCodeViaJudge0(file.content);
      const isAccepted = result.status.id === 3;

      if (!isAccepted) {
        const errorMsg =
          result.compile_output ||
          result.stderr ||
          `Execution failed: ${result.status.description}`;
        setOutput(errorMsg);
        setTermStatus("error");
        errorStreakRef.current += 1;
        setConsecutiveErrors(errorStreakRef.current);
        if (errorStreakRef.current >= 3) {
          setShowLightbulb(true);
          setMentorRevealed(true);
        }
      } else {
        setOutput(result.stdout || "(no output)");
        setTermStatus("success");
        errorStreakRef.current = 0;
        setConsecutiveErrors(0);
      }
    } catch (err) {
      setOutput(
        `Network error: ${err instanceof Error ? err.message : String(err)}`
      );
      setTermStatus("error");
      errorStreakRef.current += 1;
      setConsecutiveErrors(errorStreakRef.current);
      if (errorStreakRef.current >= 3) {
        setShowLightbulb(true);
        setMentorRevealed(true);
      }
    } finally {
      setIsRunning(false);
    }
  }, []);

  // ── Keyboard shortcuts & Custom Events for Code Execution ──────────────────
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        handleRunCode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleRunCode();
      }
    };

    const handleRunCodeEvent = () => {
      handleRunCode();
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("spell-run-code", handleRunCodeEvent);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("spell-run-code", handleRunCodeEvent);
    };
  }, [handleRunCode]);

  const handleLightbulbClick = () => setMentorRevealed(true);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#070510",
        color: "#e0e0e0",
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-10%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(90,60,180,0.25) 0%, transparent 70%)",
          filter: "blur(80px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(120,40,200,0.2) 0%, transparent 70%)",
          filter: "blur(90px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "30%",
          right: "20%",
          width: 400,
          height: 400,
          background:
            "radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)",
          filter: "blur(70px)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* IDE chrome */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          overflow: "hidden",
        }}
      >
        {/* ── Menu bar ────────────────────────────────────────────────────── */}
        <div
          style={{
            height: 38,
            background: "rgba(19,18,34,0.5)",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: 11,
            color: "#636682",
            flexShrink: 0,
            backdropFilter: "blur(20px)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          {/* Logo */}
          <div
            style={{
              background: "rgba(167,139,250,0.15)",
              border: "1px solid rgba(167,139,250,0.3)",
              borderRadius: 6,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              boxShadow: "0 0 10px rgba(167,139,250,0.2)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#a78bfa",
              }}
            />
          </div>

          {/* Menu items */}
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {[
              "File",
              "Edit",
              "View",
              "Find",
              "Editor",
              "Debug",
              "Window",
              "Help",
              "Settings",
            ].map((m) => (
              <span
                key={m}
                style={{ cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLSpanElement).style.color = "#fff")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLSpanElement).style.color = "#636682")
                }
              >
                {m}
              </span>
            ))}
          </div>

          {/* Save indicator */}
          {saveStatus !== "idle" && (
            <div
              style={{
                marginLeft: "auto",
                fontSize: 10,
                color:
                  saveStatus === "saved"
                    ? THEME.green
                    : THEME.amber,
                letterSpacing: "0.12em",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {saveStatus === "saving" ? (
                <>
                  <LoadingSpinner size={10} /> SAVING…
                </>
              ) : (
                <>✓ SAVED</>
              )}
            </div>
          )}
        </div>

        {/* ── Main panels ─────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Left sidebar */}
          <aside
            style={{
              width: 250,
              background: "rgba(22,21,33,0.55)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
              backdropFilter: "blur(25px)",
            }}
          >
            {/* Spotlight search */}
            <div
              style={{
                height: 42,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                background: "rgba(13,12,30,0.3)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#636682"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: "absolute",
                    left: 8,
                    pointerEvents: "none",
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  placeholder="spotlight search"
                  style={{
                    width: "100%",
                    background: "rgba(28,27,45,0.6)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 6,
                    padding: "4px 8px 4px 26px",
                    fontSize: 11,
                    color: "#fff",
                    outline: "none",
                    fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Explorer header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px 6px 14px",
                fontSize: 11,
                color: "#636682",
                fontWeight: "bold",
                letterSpacing: "0.05em",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FolderIcon />
                <span>Explorer</span>
              </div>
              <span style={{ fontSize: 9, color: "#a78bfa", opacity: 0.6 }}>
                SPRINT 2
              </span>
            </div>

            {/* react-arborist file tree */}
            <div style={{ flex: 1, overflow: "hidden" }}>
              <FileTree />
            </div>
          </aside>

          {/* Center column: editor + terminal */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {/* Tab bar */}
            <div
              style={{
                height: 38,
                background: "rgba(19,18,34,0.35)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                flexShrink: 0,
              }}
            >
              {/* File tabs */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  overflowX: "auto",
                  padding: "4px 0",
                  gap: 0,
                }}
              >
                {fileNodes.map((f) => {
                  const isActive = f.id === activeFileId;
                  const isJava = f.name.endsWith(".java");
                  return (
                    <div
                      key={f.id}
                      onClick={() => setActiveFile(f.id)}
                      style={{
                        padding: "4px 12px",
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        background: isActive
                          ? "rgba(167,139,250,0.15)"
                          : "rgba(22,21,33,0.4)",
                        color: isActive ? "#fff" : "#636682",
                        border: isActive
                          ? "1px solid rgba(167,139,250,0.3)"
                          : "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 6,
                        transition: "all 0.15s",
                        marginRight: 6,
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          width: 14,
                          height: 14,
                          background: isJava
                            ? "rgba(249,115,22,0.15)"
                            : "rgba(59,130,246,0.15)",
                          border: isJava
                            ? "1px solid rgba(249,115,22,0.3)"
                            : "1px solid rgba(59,130,246,0.3)",
                          borderRadius: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          flexShrink: 0,
                        }}
                      >
                        {isJava ? "J" : "F"}
                      </span>
                      <span>{f.name}</span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          closeFile(f.id);
                        }}
                        style={{
                          fontSize: 11,
                          opacity: 0.4,
                          marginLeft: 4,
                          padding: "2px 4px",
                          borderRadius: 3,
                          transition: "background 0.12s, opacity 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.opacity = "0.4";
                        }}
                      >
                        ×
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Run controls */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                {showLightbulb && (
                  <button
                    type="button"
                    onClick={handleLightbulbClick}
                    title="Socratic Mentor — click to open hints"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      animation:
                        "spell-lightbulb-fade 0.8s ease-out forwards, spell-lightbulb-glow 2s ease-in-out infinite",
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ffb300"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 18h6M10 22h4M15.09 14c.18-.19.38-.43.56-.71.71-1.1 1.35-2.66 1.35-4.29a7 7 0 1 0-14 0c0 1.63.64 3.19 1.35 4.3.18.27.38.51.56.7" />
                    </svg>
                  </button>
                )}

                {consecutiveErrors > 0 && consecutiveErrors < 3 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: THEME.amber,
                      opacity: 0.75,
                    }}
                  >
                    ERR: {consecutiveErrors}/3
                  </span>
                )}

                <Badge label="JAVA 17" color={THEME.amber} />

                {isRunning ? (
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 7px",
                      border: `1px solid ${THEME.cyan}44`,
                      borderRadius: 2,
                      color: THEME.cyan,
                      letterSpacing: "0.15em",
                      opacity: 0.8,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <LoadingSpinner size={10} /> RUNNING
                  </span>
                ) : (
                  <Badge label="F5 OR ⌃ENTER TO RUN" color="#a78bfa" />
                )}
              </div>
            </div>

            {/* Monaco editor */}
            <div
              style={{
                flex: "0 0 65%",
                position: "relative",
                background: "rgba(29,28,43,0.75)",
                backdropFilter: "blur(20px)",
                overflow: "hidden",
              }}
            >
              {isRunning && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(29,28,43,0.7)",
                    zIndex: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <LoadingSpinner size={32} />
                    <span
                      style={{
                        color: "#a78bfa",
                        fontSize: 11,
                        letterSpacing: "0.2em",
                      }}
                    >
                      EXECUTING IN SANDBOX...
                    </span>
                  </div>
                </div>
              )}

              {activeFile ? (
                <EditorPanel
                  key={activeFile.id}
                  code={activeFile.content}
                  language={getMonacoLanguage(activeFile.name)}
                  onChange={(val) => updateFileContent(activeFile.id, val)}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#333355",
                    fontSize: 13,
                  }}
                >
                  Select a file to start editing
                </div>
              )}
            </div>

            {/* Console / terminal */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                background: "rgba(19,18,34,0.5)",
                backdropFilter: "blur(20px)",
                minHeight: 0,
              }}
            >
              <TerminalPanel output={output} status={termStatus} />
            </div>

            {/* Status bar */}
            <footer
              style={{
                height: 24,
                background: "rgba(13,11,24,0.7)",
                borderTop: "1px solid rgba(255,255,255,0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                fontSize: 10,
                color: "#636682",
                flexShrink: 0,
                backdropFilter: "blur(20px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span>
                  {activeFile
                    ? `spell-java-lab › ${activeFile.name}`
                    : "spell-java-lab"}
                </span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span style={{ color: "#a78bfa", fontSize: 8 }}>●</span>
                {isDirty && (
                  <span style={{ color: THEME.amber, fontSize: 9 }}>
                    ● unsaved
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span>CRLF</span>
                <span>UTF-8</span>
                <span>
                  {activeFile
                    ? getMonacoLanguage(activeFile.name).toUpperCase()
                    : "—"}
                </span>
              </div>
            </footer>
          </div>

          {/* ── Socratic Mentor panel ────────────────────────────────────── */}
          <aside
            style={{
              width: mentorRevealed ? 280 : 0,
              opacity: mentorRevealed ? 1 : 0,
              background: "rgba(22,21,33,0.55)",
              borderLeft: mentorRevealed
                ? "1px solid rgba(255,255,255,0.05)"
                : "none",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
              transition: "width 0.3s ease, opacity 0.3s ease",
              backdropFilter: "blur(25px)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "10px 14px 9px",
                borderBottom: "1px solid rgba(167,139,250,0.08)",
                background: "rgba(19,18,34,0.35)",
                flexShrink: 0,
                minWidth: 280,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: THEME.amber,
                    boxShadow: `0 0 6px ${THEME.amber}`,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{
                    color: "#a78bfa",
                    fontSize: 10,
                    letterSpacing: "0.2em",
                  }}
                >
                  SOCRATIC_MENTOR
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 9,
                    color: THEME.amber,
                    letterSpacing: "0.15em",
                    border: `1px solid ${THEME.amber}44`,
                    borderRadius: 2,
                    padding: "1px 5px",
                  }}
                >
                  ACTIVE
                </span>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minWidth: 280,
              }}
            >
              {mentorRevealed && consecutiveErrors >= 3 && (
                <MentorBubble text={SOCRATIC_NUDGE} isNudge />
              )}
              <MentorBubble text="Hello! I'm your Socratic Mentor. I'll ask questions to help you think — not just give answers." />
              {MENTOR_HINTS.map((hint, i) => (
                <MentorBubble key={i} text={hint} isHint />
              ))}
            </div>

            {/* Quick actions */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid rgba(167,139,250,0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
                minWidth: 280,
              }}
            >
              {["Explain my error", "Give a hint", "What's next?"].map(
                (label) => (
                  <button
                    key={label}
                    type="button"
                    style={{
                      padding: "8px 10px",
                      background: "rgba(167,139,250,0.04)",
                      border: "1px solid rgba(167,139,250,0.15)",
                      borderRadius: 4,
                      color: "#a78bfa",
                      fontSize: 11,
                      fontFamily: "inherit",
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    ⬡ {label}
                  </button>
                )
              )}
            </div>

            {/* Input */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid rgba(167,139,250,0.08)",
                display: "flex",
                gap: 8,
                flexShrink: 0,
                minWidth: 280,
              }}
            >
              <input
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setMentorInput("");
                  }
                }}
                placeholder="Ask the mentor..."
                style={{
                  flex: 1,
                  background: "rgba(21,21,34,0.6)",
                  border: "1px solid rgba(167,139,250,0.15)",
                  borderRadius: 4,
                  padding: "8px 10px",
                  color: "#ccc",
                  fontSize: 11,
                  fontFamily: "inherit",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setMentorInput("")}
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: "1px solid rgba(167,139,250,0.3)",
                  borderRadius: 4,
                  color: "#a78bfa",
                  fontSize: 11,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </aside>
        </div>
      </div>

      {/* Global keyframe animations */}
      <style>{`
        @keyframes spell-lightbulb-fade {
          from { opacity: 0; transform: scale(0.6); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spell-lightbulb-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255,179,0,0.6)); }
          50% { filter: drop-shadow(0 0 16px rgba(255,179,0,1)); }
        }
        @keyframes spell-spin {
          to { transform: rotate(360deg); }
        }
        /* react-arborist reset */
        .react-arborist-list {
          outline: none !important;
        }
      `}</style>
    </div>
  );
}

// ─── Utility components ───────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 9,
        padding: "2px 7px",
        border: `1px solid ${color}44`,
        borderRadius: 2,
        color,
        letterSpacing: "0.15em",
        opacity: 0.7,
      }}
    >
      {label}
    </span>
  );
}

function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "2px solid rgba(167,139,250,0.15)",
        borderTopColor: "#a78bfa",
        borderRadius: "50%",
        animation: "spell-spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

function MentorBubble({
  text,
  isHint = false,
  isNudge = false,
}: {
  text: string;
  isHint?: boolean;
  isNudge?: boolean;
}) {
  const borderColor = isNudge
    ? "rgba(255,179,0,0.35)"
    : isHint
    ? "rgba(167,139,250,0.15)"
    : "rgba(0,255,102,0.1)";
  const bg = isNudge
    ? "rgba(255,179,0,0.08)"
    : isHint
    ? "rgba(167,139,250,0.04)"
    : "rgba(0,255,102,0.04)";

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        borderRadius: 3,
        padding: "10px 12px",
        fontSize: 11,
        lineHeight: "17px",
        color: isNudge ? "#ffb300" : isHint ? "#a5a6c5" : "#99aabb",
      }}
    >
      {isNudge && (
        <span style={{ color: "#ffb300", marginRight: 6, fontSize: 10, fontWeight: "bold" }}>
          [MENTOR]
        </span>
      )}
      {isHint && !isNudge && (
        <span style={{ color: "#a78bfa", marginRight: 6, fontSize: 10 }}>
          ?
        </span>
      )}
      {text}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d4b255"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
