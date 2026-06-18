"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import TerminalPanel, { TerminalStatus } from "./components/TerminalPanel";
import { executeJavaCodeViaJudge0 } from "@/lib/judge0";
import { DEFAULT_JAVA_CODE } from "./components/EditorPanel";

const EditorPanel = dynamic(() => import("./components/EditorPanel"), {
  ssr: false,
});

const THEME = {
  bg: "#020204",
  green: "#00ff66",
  cyan: "#00E5FF",
  amber: "#ffb300",
} as const;

const MOCK_FILES = [
  { name: "Main.java", icon: "☕" },
  { name: "Utils.java", icon: "☕" },
  { name: "README.md", icon: "📄" },
];

const MENTOR_HINTS = [
  "What does `System.out.println()` actually do under the hood?",
  "Can you explain the difference between `int` and `Integer` in Java?",
  "What would happen if your loop started at 0 instead of 1?",
];

const SOCRATIC_NUDGE =
  "I notice you've hit a few compilation errors. Let's slow down — what line is the compiler pointing at, and what do you think it's trying to tell you?";

export default function DashboardPage() {
  const [code, setCode] = useState(DEFAULT_JAVA_CODE);
  const [output, setOutput] = useState("");
  const [termStatus, setTermStatus] = useState<TerminalStatus>("idle");
  const [activeFile, setActiveFile] = useState("Main.java");
  const [mentorInput, setMentorInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [showLightbulb, setShowLightbulb] = useState(false);
  const [mentorRevealed, setMentorRevealed] = useState(false);
  const [activeProject, setActiveProject] = useState("spell-java-lab");

  const errorStreakRef = useRef(0);

  const handleRunCode = useCallback(async () => {
    setIsRunning(true);
    setTermStatus("compiling");
    setOutput("Compiling Main.java via Judge0 API...");

    try {
      const result = await executeJavaCodeViaJudge0(code);
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
  }, [code]);

  const handleLightbulbClick = () => {
    setMentorRevealed(true);
  };

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
      {/* Background Glassmorphic Orbs */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(90, 60, 180, 0.25) 0%, transparent 70%)", filter: "blur(80px)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(120, 40, 200, 0.2) 0%, transparent 70%)", filter: "blur(90px)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "30%", right: "20%", width: 400, height: 400, background: "radial-gradient(circle, rgba(0, 229, 255, 0.08) 0%, transparent 70%)", filter: "blur(70px)", zIndex: 0, pointerEvents: "none" }} />

      {/* Main IDE Window Wrapper (Occupies 100% viewport) */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          zIndex: 1,
          overflow: "hidden",
          background: "transparent",
        }}
      >
        {/* Menu Bar */}
        <div
          style={{
            height: 38,
            background: "rgba(19, 18, 34, 0.5)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: 11,
            color: "#636682",
            flexShrink: 0,
            backdropFilter: "blur(20px)",
          }}
        >
          {/* Logo icon */}
          <div
            style={{
              background: "rgba(167, 139, 250, 0.15)",
              border: "1px solid rgba(167, 139, 250, 0.3)",
              borderRadius: 6,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              boxShadow: "0 0 10px rgba(167, 139, 250, 0.2)",
              flexShrink: 0,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#a78bfa" }} />
          </div>

          {/* Menu Items */}
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            {["File", "Edit", "View", "Find", "Editor", "Debug", "Window", "Help", "Settings"].map((m) => (
              <span
                key={m}
                style={{ cursor: "pointer", transition: "color 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#636682")}
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Content Panels split */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Glassmorphic Left Sidebar */}
          <aside
            style={{
              width: 250,
              background: "rgba(22, 21, 33, 0.55)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
              backdropFilter: "blur(25px)",
            }}
          >
            {/* Spotlight Search Header */}
            <div
              style={{
                height: 42,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                background: "rgba(13, 12, 30, 0.3)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                flexShrink: 0,
              }}
            >
              <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center" }}>
                <span style={{ position: "absolute", left: 8, color: "#636682", fontSize: 11 }}>🔍</span>
                <input
                  placeholder="spotlight search"
                  style={{
                    width: "100%",
                    background: "rgba(28, 27, 45, 0.6)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
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

            {/* Explorer title & chevron */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px 8px 14px",
                fontSize: 11,
                color: "#636682",
                fontWeight: "bold",
                letterSpacing: "0.05em",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FolderIcon />
                <span>Explorer</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ color: "#636682", cursor: "pointer", fontSize: 12 }}>+</span>
                <span style={{ color: "#636682", cursor: "pointer", fontSize: 12 }}>...</span>
              </div>
            </div>

            {/* Directory Tree */}
            <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
              <div style={{ paddingLeft: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    fontSize: 11,
                    color: "#a5a6c5",
                    cursor: "pointer",
                  }}
                >
                  <FolderIcon />
                  <span style={{ color: "#8b8ba3" }}>App-API</span>
                </div>

                <div style={{ paddingLeft: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 12px",
                      fontSize: 11,
                      color: "#a5a6c5",
                      cursor: "pointer",
                    }}
                  >
                    <FolderIcon />
                    <span>App</span>
                  </div>

                  <div style={{ paddingLeft: 12 }}>
                    {/* Mock Folders like gulp, images, fonts, icons */}
                    {["Gulp", "Images", "Fonts", "Icons"].map((fold) => (
                      <div
                        key={fold}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          fontSize: 11,
                          color: "#636682",
                          cursor: "pointer",
                        }}
                      >
                        <FolderIcon />
                        <span>{fold}</span>
                      </div>
                    ))}

                    {/* Actual Files (Main.java, Utils.java) under src / App Pages */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        fontSize: 11,
                        color: "#a5a6c5",
                        cursor: "pointer",
                      }}
                    >
                      <FolderIcon />
                      <span>Pages</span>
                    </div>

                    <div style={{ paddingLeft: 12 }}>
                      {MOCK_FILES.map((f) => (
                        <div
                          key={f.name}
                          onClick={() => setActiveFile(f.name)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 12px",
                            cursor: "pointer",
                            fontSize: 11,
                            color: activeFile === f.name ? "#ffffff" : "#636682",
                            background: activeFile === f.name ? "rgba(167, 139, 250, 0.15)" : "transparent",
                            borderLeft: activeFile === f.name ? "2px solid #a78bfa" : "2px solid transparent",
                            borderRadius: "0 4px 4px 0",
                            marginRight: 8,
                          }}
                        >
                          <FileIcon name={f.name} />
                          <span>{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Column: Editor & Terminal */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Editor Tabs bar (styled as Capsules) */}
            <div
              style={{
                height: 38,
                background: "rgba(19, 18, 34, 0.35)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 12px",
                flexShrink: 0,
              }}
            >
              {/* Pill Tabs */}
              <div style={{ display: "flex", alignItems: "center", overflowX: "auto", padding: "4px 0" }}>
                {MOCK_FILES.map((f) => {
                  const isActive = activeFile === f.name;
                  return (
                    <div
                      key={f.name}
                      onClick={() => setActiveFile(f.name)}
                      style={{
                        padding: "4px 12px",
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        background: isActive ? "rgba(167, 139, 250, 0.15)" : "rgba(22, 21, 33, 0.4)",
                        color: isActive ? "#fff" : "#636682",
                        border: isActive ? "1px solid rgba(167, 139, 250, 0.3)" : "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 6,
                        transition: "all 0.15s",
                        marginRight: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          background: f.name.endsWith(".java") ? "rgba(249, 115, 22, 0.15)" : "rgba(59, 130, 246, 0.15)",
                          border: f.name.endsWith(".java") ? "1px solid rgba(249, 115, 22, 0.3)" : "1px solid rgba(59, 130, 246, 0.3)",
                          borderRadius: 3,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileIcon name={f.name} />
                      </span>
                      <span>{f.name}</span>
                      <span style={{ fontSize: 9, opacity: 0.5, marginLeft: 4 }}>×</span>
                    </div>
                  );
                })}
              </div>

              {/* Editor action buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {showLightbulb && (
                  <button
                    type="button"
                    onClick={handleLightbulbClick}
                    title="Socratic Mentor — click to open hints"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 16,
                      animation: "spell-lightbulb-fade 0.8s ease-out forwards, spell-lightbulb-glow 2s ease-in-out infinite",
                    }}
                  >
                    💡
                  </button>
                )}

                {consecutiveErrors > 0 && consecutiveErrors < 3 && (
                  <span style={{ fontSize: 9, color: THEME.amber, opacity: 0.75 }}>
                    ERR: {consecutiveErrors}/3
                  </span>
                )}

                <Badge label="JAVA 17" color={THEME.amber} />

                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  style={{
                    padding: "3px 10px",
                    background: isRunning ? "rgba(0, 229, 255, 0.1)" : "rgba(167, 139, 250, 0.08)",
                    border: isRunning ? "1px solid #00e5ff" : "1px solid #a78bfa",
                    borderRadius: 4,
                    color: isRunning ? "#00e5ff" : "#a78bfa",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: isRunning ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>{isRunning ? "⚡" : "▶"}</span>
                  <span>{isRunning ? "RUNNING" : "RUN"}</span>
                </button>
              </div>
            </div>

            {/* Monaco Container */}
            <div
              style={{
                flex: "0 0 65%",
                position: "relative",
                background: "rgba(29, 28, 43, 0.75)",
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
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <LoadingSpinner size={32} />
                    <span style={{ color: "#a78bfa", fontSize: 11, letterSpacing: "0.2em" }}>
                      EXECUTING IN SANDBOX...
                    </span>
                  </div>
                </div>
              )}
              <EditorPanel code={code} onChange={setCode} />
            </div>

            {/* Console Panel */}
            <div
              style={{
                flex: 1,
                overflow: "hidden",
                background: "rgba(19, 18, 34, 0.5)",
                backdropFilter: "blur(20px)",
              }}
            >
              <TerminalPanel output={output} status={termStatus} />
            </div>

            {/* Status Bar */}
            <footer
              style={{
                height: 24,
                background: "rgba(13, 11, 24, 0.7)",
                borderTop: "1px solid rgba(255, 255, 255, 0.03)",
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
                <span>spell-java-lab / src / {activeFile}</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>13:26</span>
                <span style={{ color: "#a78bfa", fontSize: 8 }}>●</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <span>CRLF</span>
                <span>UTF-8</span>
                <span>Java</span>
              </div>
            </footer>
          </div>

          {/* Socratic Mentor (Glassmorphic) */}
          <aside
            style={{
              width: mentorRevealed ? 280 : 0,
              opacity: mentorRevealed ? 1 : 0,
              background: "rgba(22, 21, 33, 0.55)",
              borderLeft: mentorRevealed ? "1px solid rgba(255, 255, 255, 0.05)" : "none",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
              transition: "width 0.3s ease, opacity 0.3s ease",
              backdropFilter: "blur(25px)",
            }}
          >
            <div
              style={{
                padding: "10px 14px 9px",
                borderBottom: "1px solid rgba(167, 139, 250, 0.08)",
                background: "rgba(19, 18, 34, 0.35)",
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
                <span style={{ color: "#a78bfa", fontSize: 10, letterSpacing: "0.2em" }}>
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
              {mentorRevealed && consecutiveErrors >= 3 && <MentorBubble text={SOCRATIC_NUDGE} isNudge />}
              <MentorBubble text="Hello! I'm your Socratic Mentor. I'll ask questions to help you think — not just give answers." />
              {MENTOR_HINTS.map((hint, i) => (
                <MentorBubble key={i} text={hint} isHint />
              ))}
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid rgba(167, 139, 250, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
                minWidth: 280,
              }}
            >
              {["Explain my error", "Give a hint", "What's next?"].map((label) => (
                <button
                  key={label}
                  type="button"
                  style={{
                    padding: "8px 10px",
                    background: "rgba(167, 139, 250, 0.04)",
                    border: `1px solid rgba(167, 139, 250, 0.15)`,
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
              ))}
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid rgba(167, 139, 250, 0.08)",
                display: "flex",
                gap: 8,
                flexShrink: 0,
                minWidth: 280,
              }}
            >
              <input
                value={mentorInput}
                onChange={(e) => setMentorInput(e.target.value)}
                placeholder="Ask the mentor..."
                style={{
                  flex: 1,
                  background: "rgba(21, 21, 34, 0.6)",
                  border: "1px solid rgba(167, 139, 250, 0.15)",
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
                style={{
                  padding: "8px 12px",
                  background: "transparent",
                  border: `1px solid rgba(167, 139, 250, 0.3)`,
                  borderRadius: 4,
                  color: "#a78bfa",
                  fontSize: 11,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                ▶
              </button>
            </div>
          </aside>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spell-lightbulb-fade {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes spell-lightbulb-glow {
          0%,
          100% {
            filter: drop-shadow(0 0 6px rgba(255, 179, 0, 0.6));
          }
          50% {
            filter: drop-shadow(0 0 16px rgba(255, 179, 0, 1));
          }
        }
        @keyframes spell-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

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
      ? "rgba(167, 139, 250, 0.15)"
      : "rgba(0,255,102,0.1)";
  const bg = isNudge
    ? "rgba(255,179,0,0.08)"
    : isHint
      ? "rgba(167, 139, 250, 0.04)"
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
        <span style={{ color: "#ffb300", marginRight: 6, fontSize: 10 }}>
          💡
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4b255" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const isJava = name.endsWith(".java");
  const strokeColor = isJava ? "#f97316" : "#3b82f6";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {isJava ? (
        <>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
          <line x1="6" y1="1" x2="6" y2="4"></line>
          <line x1="10" y1="1" x2="10" y2="4"></line>
          <line x1="14" y1="1" x2="14" y2="4"></line>
        </>
      ) : (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </>
      )}
    </svg>
  );
}
