export interface Judge0Result {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
  time?: string | null;
  memory?: number | null;
}

export async function executeJavaCodeViaJudge0(
  code: string
): Promise<Judge0Result> {
  // Safe base64 encoding for Unicode
  const base64Code = btoa(unescape(encodeURIComponent(code)));

  // Use Java language ID 62 (OpenJDK 13.0.1)
  const payload = {
    source_code: base64Code,
    language_id: 62,
  };

  const response = await fetch(
    "/api/submissions?wait=true&base64_encoded=true",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Judge0 execution failed: ${errorText}`);
  }

  const result = (await response.json()) as Judge0Result;

  // Safe base64 decoding for Unicode outputs
  if (result.stdout) {
    try {
      result.stdout = decodeURIComponent(escape(atob(result.stdout)));
    } catch {
      // Fallback in case of decoding issues
      result.stdout = atob(result.stdout);
    }
  }
  if (result.stderr) {
    try {
      result.stderr = decodeURIComponent(escape(atob(result.stderr)));
    } catch {
      result.stderr = atob(result.stderr);
    }
  }
  if (result.compile_output) {
    try {
      result.compile_output = decodeURIComponent(
        escape(atob(result.compile_output))
      );
    } catch {
      result.compile_output = atob(result.compile_output);
    }
  }

  return result;
}
