"use client";

import { useState } from "react";
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
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

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
        setErrorMessage(error.message);
        setStatus("error");
      } else {
        await new Promise((r) => setTimeout(r, 900));
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed");
      setStatus("error");
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: THEME.bg,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          height: 320,
          background:
            "radial-gradient(ellipse, rgba(0,255,102,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="mb-10 text-center select-none">
        <h1
          style={{
            fontSize: 48,
            letterSpacing: "0.35em",
            color: THEME.green,
            fontWeight: 700,
            textShadow: "0 0 24px rgba(0,255,102,0.55), 0 0 2px #00ff66",
            lineHeight: 1,
          }}
        >
          S P E L L
        </h1>
        <p
          style={{
            color: THEME.cyan,
            fontSize: 12,
            letterSpacing: "0.25em",
            marginTop: 8,
            opacity: 0.7,
          }}
        >
          SOCRATIC PROGRAMMING &amp; EDUCATIONAL LEARNING LAB
        </p>
      </div>

      <form
        onSubmit={handleAuth}
        style={{
          background: "#0a0a0f",
          border: "1px solid rgba(0,255,102,0.18)",
          borderRadius: 4,
          padding: "40px 36px",
          width: 360,
          boxShadow:
            "0 0 48px rgba(0,255,102,0.06), 0 2px 24px rgba(0,0,0,0.8)",
        }}
      >
        <p
          style={{
            color: THEME.green,
            fontSize: 11,
            letterSpacing: "0.2em",
            marginBottom: 28,
            opacity: 0.8,
          }}
        >
          ▶ {isSignUp ? "CREATE NEW SESSION" : "AUTHENTICATE SESSION"}
        </p>

        <label style={{ display: "block", marginBottom: 16 }}>
          <span
            style={{
              color: THEME.cyan,
              fontSize: 11,
              letterSpacing: "0.15em",
              display: "block",
              marginBottom: 6,
            }}
          >
            EMAIL
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus("idle");
            }}
            placeholder="student@spell.lab"
            autoComplete="email"
            style={inputStyle}
          />
        </label>

        <label style={{ display: "block", marginBottom: 28 }}>
          <span
            style={{
              color: THEME.cyan,
              fontSize: 11,
              letterSpacing: "0.15em",
              display: "block",
              marginBottom: 6,
            }}
          >
            PASSWORD
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setStatus("idle");
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>

        {status === "error" && (
          <p
            style={{
              color: THEME.amber,
              fontSize: 11,
              marginBottom: 14,
              letterSpacing: "0.1em",
            }}
          >
            ✗ {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          style={{
            width: "100%",
            padding: "12px",
            background:
              status === "loading" ? "rgba(0,255,102,0.1)" : "transparent",
            border: `1px solid ${THEME.green}`,
            borderRadius: 2,
            color: THEME.green,
            fontSize: 12,
            letterSpacing: "0.2em",
            fontFamily: "inherit",
            cursor: status === "loading" ? "wait" : "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            boxShadow:
              status === "loading" ? "0 0 16px rgba(0,255,102,0.2)" : "none",
            marginBottom: 16,
          }}
        >
          {status === "loading"
            ? "[ INITIALIZING... ]"
            : isSignUp
              ? "[ CREATE ACCOUNT ]"
              : "[ INITIALIZE CORE SYSTEM ]"}
        </button>

        <div style={{ textAlign: "center" }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setStatus("idle");
              setErrorMessage("");
            }}
            style={{
              background: "transparent",
              border: "none",
              color: THEME.cyan,
              fontSize: 10,
              cursor: "pointer",
              letterSpacing: "0.1em",
              opacity: 0.7,
              textDecoration: "underline",
            }}
          >
            {isSignUp
              ? "Already have an account? Sign In"
              : "Need an account? Sign Up"}
          </button>
        </div>

        <p
          style={{
            color: "#444",
            fontSize: 10,
            marginTop: 20,
            textAlign: "center",
            letterSpacing: "0.1em",
          }}
        >
          {isMockAuth
            ? "SPRINT 2 — MOCK AUTH ACTIVE"
            : "SPRINT 2 — SUPABASE AUTH ACTIVE"}
        </p>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#020204",
  border: "1px solid rgba(0,229,255,0.2)",
  borderRadius: 2,
  padding: "10px 12px",
  color: "#e0e0e0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
