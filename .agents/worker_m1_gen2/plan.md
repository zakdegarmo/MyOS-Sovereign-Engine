# Implementation Plan - Security and Robustness Fixes for Backend Bridge

## Steps

1. **Understand and Verify Existing Vulnerabilities**:
   - Trace all `powershell.exe` execution paths in `apps/web/agent-bridge.js`.
   - Identify the interpolation in `/api/win/launch` popup scripting which allows subexpression execution when using double quotes.

2. **Modify Code in `apps/web/agent-bridge.js`**:
   - **Fix 1: Interactive Confirmation Command Injection**:
     - Escape single quotes in `target` for PowerShell literal strings: `const escapedTarget = target.replace(/'/g, "''");`
     - Change the PowerShell popup command script to use single quotes around the target string and concatenate with double-quoted string containing newlines.
     - Change `exec(popupScript, { shell: 'powershell.exe' }, ...)` to `execFile('powershell.exe', ['-NoProfile', '-Command', popupScript], ...)`.
   - **Fix 2: Missing `-NoProfile`**:
     - Update `/api/desktop/files`: change `exec(psCommand, { shell: 'powershell.exe' }, ...)` to `execFile('powershell.exe', ['-NoProfile', '-Command', psCommand], ...)`.
     - Update `/api/exec`: change `exec(data.command, { cwd, shell: 'powershell.exe', env }, ...)` to `execFile('powershell.exe', ['-NoProfile', '-Command', data.command], { cwd, env }, ...)`.
     - Update `/api/vision/capture`: change `exec(...)` to `execFile('powershell.exe', ['-NoProfile', '-Command', captureCmd], ...)`.

3. **Verify Standard Functionality**:
   - Start `agent-bridge.js`.
   - Run `verify_bridge.js` to ensure the bridge's standard APIs respond correctly and do not crash or hang.

4. **Verify Command Injection Mitigation**:
   - Send a POST request to `/api/win/launch` with payload `{"target": "\" + (Start-Process calc) + \""}`.
   - Verify that the target is handled safely and Calculator does NOT execute.
   - Verify that the request times out or is rejected (due to non-interactive environment/timeout) and returns the expected response.

5. **Documentation**:
   - Record details of the changes in `changes.md`.
   - Record findings and verification results in `handoff.md`.
