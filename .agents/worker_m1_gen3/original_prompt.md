## 2026-06-30T22:40:28Z

You are the Worker (Generation 3) for Milestone 1: Backend Bridge.
Your working directory (for metadata/plans/reports): c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_gen3
Workspace root: c:\Users\zakde\Desktop\AntiGravity projects\MyOS

Objective:
Resolve three security and robustness findings identified during the security review of the backend bridge implementation.

Findings to Implement:
1. [Major] Whitelist Basename Bypass Vulnerability:
   In `apps/web/agent-bridge.js` (around lines 372-382), the whitelist check checks only the basename of the target parameter. This permits a malicious executable named `calc.exe` to run from untrusted directories (e.g., `C:\Users\zakde\Downloads\calc.exe`) and bypass the prompt.
   Fix: Modify the whitelist check so that we verify that the input is a bare command name (i.e. does not contain directory separators like `\` or `/`) in addition to being in the whitelist. E.g.
   const isBareName = !target.includes('\\') && !target.includes('/');
   const isWhitelisted = isBareName && whitelist.has(nameWithoutExt);

2. [Major] Sibling Directory Jailbreak in `isSafePath`:
   In `apps/web/agent-bridge.js` (lines 219-234), `isSafePath` uses prefix matching (startsWith) which is vulnerable to prefix overlap (e.g. `MyOS-malicious-sibling` matching `MyOS`).
   Fix: Implement a helper function `isPathInside(parentPath, childPath)` that performs a safe prefix check:
   ```javascript
   function isPathInside(parentPath, childPath) {
       const prefixLower = path.resolve(parentPath).toLowerCase();
       const resolvedLower = path.resolve(childPath).toLowerCase();
       if (resolvedLower === prefixLower) return true;
       return resolvedLower.startsWith(prefixLower + path.sep);
   }
   ```
   Then use `isPathInside` for `isInsideProject`, `isGeminiDir`, `isDownloadsDir`, and `isDesktopDir` checks in `isSafePath`.

3. [Major] Recursive Symlink Scanning in `scanSector`:
   In `apps/web/agent-bridge.js` (lines 236-262), `scanSector` uses `fs.stat` which resolves symbolic links and can lead to path traversal / loops.
   Fix: Replace `fs.stat(fullPath)` with `fs.lstat(fullPath)`. If the path is a symbolic link (`stat.isSymbolicLink()`), skip it (do not scan or recurse).

Instructions:
- Carefully modify `apps/web/agent-bridge.js` to implement these three fixes.
- Run `verify_bridge.js` to ensure the bridge functions correctly.
- Record your changes in `changes.md` and write a detailed handoff report in `handoff.md` in your working directory. Include verification commands run and their outputs.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Use PowerShell syntax for terminal commands. When done, call send_message to report completion to the orchestrator.
