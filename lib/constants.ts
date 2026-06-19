/**
 * Shared constants used across the SPELL IDE.
 */

export const DEFAULT_JAVA_CODE = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from SPELL IDE!");
        
        // Try editing me and hitting RUN above
        int sum = 0;
        for (int i = 1; i <= 10; i++) {
            sum += i;
        }
        System.out.println("Sum 1–10 = " + sum);
    }
}`;

export const DEFAULT_UTILS_CODE = `// Utils.java — add reusable helper methods here
public class Utils {

    public static int add(int a, int b) {
        return a + b;
    }

    public static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(s);
        return sb.toString();
    }
}`;

export const DEFAULT_README = `# SPELL Java Lab

Welcome to your **Socratic Programming & Educational Learning Lab**!

## Getting Started

1. Edit \`Main.java\` to write your program.
2. Press **F5** or **Ctrl+Enter** to compile and execute.
3. If you hit 3 errors in a row, the **Mentor** panel will open with Socratic hints.

## Files

- \`Main.java\` — your primary entry point
- \`Utils.java\` — reusable helper methods
- \`README.md\` — this file

## Tips

- Press **F2** on a variable to rename it
- Double-click a file in the sidebar to rename it
- Use **+ File** / **+ Folder** in the sidebar toolbar to add files
`;
