const PISTON_API = "https://emkc.org/api/v2/piston/execute";

export type NetworkStatus = "ok" | "error";
export type ExecutionStatus = "success" | "compile_error" | "runtime_error" | "unknown";

export interface PistonResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  networkStatus: NetworkStatus;
  executionStatus: ExecutionStatus;
}

interface PistonRunPayload {
  run?: { stdout?: string; stderr?: string; code?: number };
  compile?: { stdout?: string; stderr?: string; code?: number };
}

export async function executeJavaCode(code: string): Promise<PistonResult> {
  let response: Response;

  try {
    response = await fetch(PISTON_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "java",
        version: "15.0.2",
        files: [{ name: "Main.java", content: code }],
      }),
    });
  } catch {
    return {
      stdout: "",
      stderr: "Network request failed — check your connection and try again.",
      exitCode: -1,
      networkStatus: "error",
      executionStatus: "unknown",
    };
  }

  if (!response.ok) {
    return {
      stdout: "",
      stderr: `Piston API error: ${response.status} ${response.statusText}`,
      exitCode: response.status,
      networkStatus: "error",
      executionStatus: "unknown",
    };
  }

  const data = (await response.json()) as PistonRunPayload;
  const run = data.run ?? {};
  const compile = data.compile ?? {};

  const compileStderr = compile.stderr ?? "";
  const runStderr = run.stderr ?? "";
  const stderr = compileStderr || runStderr;
  const stdout = run.stdout ?? compile.stdout ?? "";
  const exitCode = run.code ?? compile.code ?? -1;

  let executionStatus: ExecutionStatus = "success";
  if (compileStderr || (compile.code !== undefined && compile.code !== 0)) {
    executionStatus = "compile_error";
  } else if (runStderr || (run.code !== undefined && run.code !== 0)) {
    executionStatus = "runtime_error";
  }

  return {
    stdout,
    stderr,
    exitCode,
    networkStatus: "ok",
    executionStatus,
  };
}
