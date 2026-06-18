import { NextResponse } from "next/server";
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base64Encoded = searchParams.get("base64_encoded") === "true";

    const body = await request.json();
    let sourceCode = body.source_code || "";
    let stdin = body.stdin || "";

    if (base64Encoded) {
      sourceCode = Buffer.from(sourceCode, "base64").toString("utf-8");
      if (stdin) {
        stdin = Buffer.from(stdin, "base64").toString("utf-8");
      }
    }

    const judge0Url = process.env.NEXT_PUBLIC_JUDGE0_API_URL;
    const judge0Key = process.env.NEXT_PUBLIC_JUDGE0_API_KEY;

    if (judge0Url) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (judge0Key) {
        headers["x-rapidapi-key"] = judge0Key;
        headers["X-Auth-Token"] = judge0Key;
      }

      const response = await fetch(`${judge0Url}/submissions?wait=true`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Judge0 returned error status: ${response.status}` },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Local execution fallback: compile and execute using javac and java
    const runId = Math.random().toString(36).substring(7);
    const runDir = path.join(process.cwd(), "scratch", "runs", runId);

    // Ensure run directory exists
    fs.mkdirSync(runDir, { recursive: true });

    const filePath = path.join(runDir, "Main.java");
    fs.writeFileSync(filePath, sourceCode, "utf-8");

    // 1. Compile Main.java
    const compileResult = spawnSync("javac", ["Main.java"], {
      cwd: runDir,
      timeout: 10000, // 10s compile timeout
      encoding: "utf-8",
    });

    let statusId = 3; // Accepted
    let statusDescription = "Accepted";
    let stdout = null;
    let stderr = null;
    let compileOutput = null;

    if (compileResult.status !== 0) {
      statusId = 6;
      statusDescription = "Compilation Error";
      compileOutput =
        compileResult.stderr || compileResult.stdout || "Compilation failed";
    } else {
      // 2. Execute Main class
      const runResult = spawnSync("java", ["Main"], {
        cwd: runDir,
        input: stdin,
        timeout: 5000, // 5s run timeout
        encoding: "utf-8",
      });

      if (runResult.error && (runResult.error as any).code === "ETIMEDOUT") {
        statusId = 5;
        statusDescription = "Time Limit Exceeded";
        stderr = "Time Limit Exceeded (5 seconds)";
      } else if (runResult.status !== 0) {
        statusId = 11; // Runtime Error (NZEC)
        statusDescription = "Runtime Error (NZEC)";
        stderr =
          runResult.stderr || runResult.stdout || "Runtime execution failed";
      } else {
        stdout = runResult.stdout || "";
      }
    }

    // Cleanup execution files
    try {
      fs.rmSync(runDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Cleanup failed for directory:", runDir, cleanupError);
    }

    if (base64Encoded) {
      if (stdout) stdout = Buffer.from(stdout).toString("base64");
      if (stderr) stderr = Buffer.from(stderr).toString("base64");
      if (compileOutput)
        compileOutput = Buffer.from(compileOutput).toString("base64");
    }

    const responsePayload = {
      stdout,
      stderr,
      compile_output: compileOutput,
      time: "0.050",
      memory: 2048,
      token: `mock-token-${runId}`,
      message: statusId === 11 ? "Runtime Error (NZEC)" : null,
      status: {
        id: statusId,
        description: statusDescription,
      },
    };

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
