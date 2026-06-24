export type JavaErrorCategory = 
  | 'SEMICOLON_MISSING' 
  | 'BRACE_MISMATCH' 
  | 'CLASS_NOT_FOUND' 
  | 'TYPE_MISMATCH' 
  | 'UNKNOWN';

export interface ParsedError {
  category: JavaErrorCategory;
  line?: number;
  explanation: string;
}

export function parseJavaError(stderr: string): ParsedError {
  if (!stderr) {
    return {
      category: 'UNKNOWN',
      explanation: 'An unknown execution error occurred.'
    };
  }

  // 1. Semicolon missing
  // Typical output: "Main.java:12: error: ';' expected"
  const semicolonMatch = stderr.match(/:(\d+):\s*error:\s*';'\s*expected/i);
  if (semicolonMatch) {
    return {
      category: 'SEMICOLON_MISSING',
      line: parseInt(semicolonMatch[1], 10),
      explanation: 'Think of code lines like trains; they need a caboose (a semicolon) to prevent crashing into each other.'
    };
  }

  // 2. Brace mismatch / Reached end of file while parsing
  // Typical output: "Main.java:20: error: reached end of file while parsing"
  const braceMatch = stderr.match(/:(\d+):\s*error:\s*reached end of file while parsing/i);
  if (braceMatch) {
    return {
      category: 'BRACE_MISMATCH',
      line: parseInt(braceMatch[1], 10),
      explanation: 'Java is looking for a closing brace `}`. Every time you open a block of code, you must explicitly close it.'
    };
  }

  // 3. Class not found / Cannot find symbol
  // Typical output: "Main.java:8: error: cannot find symbol"
  const symbolMatch = stderr.match(/:(\d+):\s*error:\s*cannot find symbol/i);
  if (symbolMatch) {
    return {
      category: 'CLASS_NOT_FOUND',
      line: parseInt(symbolMatch[1], 10),
      explanation: 'The compiler does not recognize a variable or class you used. Did you misspell it or forget to declare/import it?'
    };
  }

  // 4. Type mismatch
  // Typical output: "Main.java:10: error: incompatible types"
  const typeMatch = stderr.match(/:(\d+):\s*error:\s*incompatible types/i);
  if (typeMatch) {
    return {
      category: 'TYPE_MISMATCH',
      line: parseInt(typeMatch[1], 10),
      explanation: 'You are trying to put a square peg in a round hole. The data type you provided does not match what Java expects here.'
    };
  }

  return {
    category: 'UNKNOWN',
    explanation: 'There seems to be an issue, but it does not match our common patterns. Check the terminal for exact details.'
  };
}

/**
 * Utility to strip single-line and multi-line comments from Java code payload.
 * Used to prevent comment-based prompt injection before sending code to LLM pipeline.
 */
export function stripJavaComments(code: string): string {
  if (!code) return code;
  // Removes block comments /* ... */ and line comments // ...
  return code.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
}
