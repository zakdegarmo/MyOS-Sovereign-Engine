# Changes Made to Backend Bridge

## Modifications in `apps/web/agent-bridge.js`

1. **Mitigated PowerShell Command Injection in Interactive Confirmation Popup**:
   - Updated the `/api/win/launch` endpoint confirmation popup script (lines 398–416).
   - Escaped single quotes in the launch target: `const escapedTarget = target.replace(/'/g, "''");`.
   - Replaced PowerShell double-quoted string interpolation for the target name with PowerShell single quotes:
     ```javascript
     $res = $ws.Popup('An agent is requesting to launch: ' + '${escapedTarget}' + "\`n\`nDo you want to allow this?", 15, "Security Confirmation", 36)
     ```
     This prevents PowerShell from executing nested subexpressions (like `$(Start-Process calc)`) inside double quotes.
   - Replaced `exec` using `{ shell: 'powershell.exe' }` with `execFile('powershell.exe', ['-NoProfile', '-Command', popupScript])` to run PowerShell safely and without user profile loading.

2. **Added `-NoProfile` Flag to all PowerShell Invocations**:
   - `/api/desktop/files` (line 336): Replaced `exec(psCommand, { shell: 'powershell.exe' })` with `execFile('powershell.exe', ['-NoProfile', '-Command', psCommand])`.
   - `/api/exec` (line 633): Replaced `exec(data.command, { shell: 'powershell.exe' })` with `execFile('powershell.exe', ['-NoProfile', '-Command', data.command], { cwd, env })`.
   - `/api/vision/capture` (line 670): Replaced `exec("powershell.exe -Command ...")` with `execFile('powershell.exe', ['-NoProfile', '-Command', captureCmd])`.
