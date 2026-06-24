"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase, isMockAuth } from "@/lib/supabaseClient";

const THEME = {
  bg: "#020204",
  green: "#00ff66",
  cyan: "#00E5FF",
  amber: "#ffb300",
} as const;

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success" | "redirecting"
  >("idle");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("redirecting");
        router.push("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Enter a valid email address");
      setStatus("error");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        let msg = "Authentication failed";
        if (typeof error === "string") {
          msg = error;
        } else if (error.message && typeof error.message === "string") {
          msg = error.message;
        } else {
          msg = JSON.stringify(error);
        }
        if (msg === "{}" || msg.trim() === "") {
          msg = "Network or SMTP error. Please check your Supabase rate limits or custom SMTP configuration.";
        }
        setErrorMessage(msg);
        setStatus("error");
      } else {
        if (isSignUp && !data.session) {
          setStatus("success");
        } else {
          setStatus("redirecting");
          await new Promise((r) => setTimeout(r, 900));
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      let msg = "Authentication failed";
      if (typeof err === "string") {
        msg = err;
      } else if (err?.message && typeof err.message === "string") {
        msg = err.message;
      } else if (err) {
        try {
          msg = JSON.stringify(err);
        } catch {
          msg = "Unknown error";
        }
      }
      if (msg === "{}" || msg.trim() === "") {
        msg = "Network or SMTP error. Please check your Supabase configuration.";
      }
      setErrorMessage(msg);
      setStatus("error");
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: "#070510",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: "#e0e0e0",
      }}
    >
      {/* ── Background orbs matching IDE ── */}
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

      {/* ── Header ── */}
      <div className="mb-12 text-center select-none relative z-10">
        <h1
          style={{
            fontSize: 56,
            letterSpacing: "0.35em",
            color: THEME.green,
            fontWeight: 700,
            textShadow: "0 0 15px rgba(0, 255, 102, 0.35)",
            lineHeight: 1,
            margin: 0,
          }}
        >
          S P E L L
        </h1>
        <p
          style={{
            color: THEME.cyan,
            fontSize: 12,
            letterSpacing: "0.25em",
            marginTop: 12,
            opacity: 0.6,
          }}
        >
          SOCRATIC PROGRAMMING &amp; EDUCATIONAL LEARNING LAB
        </p>
      </div>

      {/* ── Glassmorphic Auth Card ── */}
      <div
        className="relative z-10 w-full max-w-md mx-4"
        style={{
          background: "rgba(10, 10, 15, 0.65)",
          backdropFilter: "blur(25px) saturate(140%)",
          WebkitBackdropFilter: "blur(25px) saturate(140%)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
          boxShadow:
            "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
          borderRadius: 8,
          padding: "48px 40px",
          overflow: "hidden",
        }}
      >
        {/* Subtle neon glowing top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0,255,102,0.3) 50%, transparent 100%)",
          }}
        />

        {status === "redirecting" ? (
          /* ── Redirecting / Loading State ── */
          <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
            <div className="relative w-16 h-16 mb-8">
              <div
                className="absolute inset-0 rounded-full border-t-2 border-r-2 animate-spin"
                style={{ borderColor: THEME.green, animationDuration: "1s" }}
              />
              <div
                className="absolute inset-2 rounded-full border-b-2 border-l-2 animate-spin"
                style={{
                  borderColor: THEME.cyan,
                  animationDuration: "1.5s",
                  animationDirection: "reverse",
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ color: THEME.green }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="13 2 13 9 20 9" />
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                </svg>
              </div>
            </div>
            <p
              style={{
                color: THEME.cyan,
                fontSize: 12,
                letterSpacing: "0.15em",
                textAlign: "center",
              }}
            >
              SYNCHRONIZING SESSION...
            </p>
          </div>
        ) : status === "success" ? (
          /* ── Dynamic "Confirm Email" Success State ── */
          <div className="flex flex-col items-center justify-center py-6 animate-fade-in text-center">
            <div
              className="mb-8 p-4 rounded-full"
              style={{
                background: "rgba(255, 179, 0, 0.1)",
                boxShadow: "0 0 30px rgba(255, 179, 0, 0.2)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke={THEME.amber}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h2
              style={{
                color: THEME.amber,
                fontSize: 16,
                letterSpacing: "0.1em",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              AUTHORIZATION KEY DISPATCHED
            </h2>
            <p
              style={{
                color: "#a0a0b0",
                fontSize: 12,
                lineHeight: 1.6,
                letterSpacing: "0.05em",
              }}
            >
              Success! A secure authorization key has been dispatched to your
              inbox. Tap the validation link to synchronize your session
              parameters.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setIsSignUp(false);
                setEmail("");
                setPassword("");
              }}
              className="mt-8 hover:text-white transition-colors"
              style={{
                background: "transparent",
                border: "none",
                color: THEME.cyan,
                fontSize: 11,
                cursor: "pointer",
                letterSpacing: "0.1em",
                opacity: 0.8,
                textDecoration: "underline",
              }}
            >
              Return to Login Protocol
            </button>
          </div>
        ) : (
          /* ── Standard Auth Form ── */
          <form onSubmit={handleAuth} className="animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: THEME.green,
                  borderRadius: "50%",
                  boxShadow: `0 0 10px ${THEME.green}`,
                }}
              />
              <p
                style={{
                  color: THEME.green,
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  margin: 0,
                  opacity: 0.9,
                }}
              >
                {isSignUp ? "CREATE NEW SESSION" : "AUTHENTICATE SESSION"}
              </p>
            </div>

            <div className="mb-6">
              <label
                htmlFor="email"
                style={{
                  color: THEME.cyan,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  display: "block",
                  marginBottom: 8,
                  opacity: 0.8,
                }}
              >
                EMAIL IDENTIFIER
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="operative@spell.lab"
                autoComplete="email"
                className="w-full transition-all duration-300 placeholder-gray-700"
                style={{
                  background: "#020204",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "'Fira Code', monospace",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0, 255, 102, 0.4)";
                  e.target.style.boxShadow =
                    "0 0 10px rgba(0, 255, 102, 0.1), inset 0 2px 4px rgba(0,0,0,0.5)";
                  e.target.style.color = THEME.cyan;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.5)";
                  e.target.style.color = "#fff";
                }}
              />
            </div>

            <div className="mb-8">
              <label
                htmlFor="password"
                style={{
                  color: THEME.cyan,
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  display: "block",
                  marginBottom: 8,
                  opacity: 0.8,
                }}
              >
                SECURITY PASSPHRASE
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full transition-all duration-300 placeholder-gray-700"
                style={{
                  background: "#020204",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 4,
                  padding: "12px 14px",
                  color: "#fff",
                  fontSize: 13,
                  outline: "none",
                  fontFamily: "'Fira Code', monospace",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(0, 255, 102, 0.4)";
                  e.target.style.boxShadow =
                    "0 0 10px rgba(0, 255, 102, 0.1), inset 0 2px 4px rgba(0,0,0,0.5)";
                  e.target.style.color = THEME.cyan;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255,255,255,0.08)";
                  e.target.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.5)";
                  e.target.style.color = "#fff";
                }}
              />
            </div>

            {status === "error" && (
              <div
                className="mb-6 p-3 rounded"
                style={{
                  background: "rgba(255, 179, 0, 0.05)",
                  border: "1px solid rgba(255, 179, 0, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ color: THEME.amber, fontSize: 12 }}>✗</span>
                <p
                  style={{
                    color: THEME.amber,
                    fontSize: 11,
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  {errorMessage}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full relative group transition-all duration-300"
              style={{
                background:
                  status === "loading"
                    ? "rgba(0,255,102,0.1)"
                    : "rgba(0, 255, 102, 0.05)",
                border: `1px solid ${
                  status === "loading"
                    ? THEME.green
                    : "rgba(0, 255, 102, 0.3)"
                }`,
                borderRadius: 4,
                padding: "14px",
                cursor: status === "loading" ? "wait" : "pointer",
                overflow: "hidden",
                marginBottom: 24,
              }}
              onMouseEnter={(e) => {
                if (status !== "loading") {
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(0,255,102,0.2)";
                  e.currentTarget.style.background = "rgba(0, 255, 102, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(0, 255, 102, 0.6)";
                }
              }}
              onMouseLeave={(e) => {
                if (status !== "loading") {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "rgba(0, 255, 102, 0.05)";
                  e.currentTarget.style.borderColor = "rgba(0, 255, 102, 0.3)";
                }
              }}
            >
              {/* Button inner text */}
              <span
                className="relative z-10 flex items-center justify-center gap-2"
                style={{
                  color: THEME.green,
                  fontSize: 12,
                  letterSpacing: "0.2em",
                  fontWeight: 600,
                  textShadow: "0 0 10px rgba(0, 255, 102, 0.2)",
                }}
              >
                {status === "loading" ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full border-t-2 border-r-2 animate-spin"
                      style={{ borderColor: THEME.green }}
                    />
                    [ INITIALIZING... ]
                  </>
                ) : isSignUp ? (
                  "[ CREATE ACCOUNT ]"
                ) : (
                  "[ INITIALIZE CORE SYSTEM ]"
                )}
              </span>
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  if (status === "error") setStatus("idle");
                  setErrorMessage("");
                }}
                className="hover:text-white transition-colors duration-200"
                style={{
                  background: "transparent",
                  border: "none",
                  color: THEME.cyan,
                  fontSize: 10,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  opacity: 0.6,
                }}
              >
                {isSignUp
                  ? ">> ALREADY ACTIVE? SIGN IN"
                  : ">> NEW OPERATIVE? SIGN UP"}
              </button>
            </div>

            <div
              className="mt-8 pt-6 text-center border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              <p
                style={{
                  color: "#555",
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  margin: 0,
                }}
              >
                {isMockAuth
                  ? "SYS // MOCK_AUTH_ACTIVE"
                  : "SYS // SUPABASE_AUTH_ACTIVE"}
              </p>
            </div>
          </form>
        )}
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </main>
  );
}
