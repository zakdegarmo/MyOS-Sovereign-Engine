## 2026-06-29T02:53:51Z
Objective:
Implement the `GET /api/desktop/files` and `POST /api/win/launch` endpoints in `apps/web/agent-bridge.js` and create the verification script `verify_bridge.js` at the project root.

Instructions:
1. Modify `apps/web/agent-bridge.js` to implement:
   - `GET /api/desktop/files`: Scans `C:\Users\zakde\Desktop` (with fallback to the user's desktop path using `[System.Environment]::GetFolderPath('Desktop')`) via PowerShell and parses the results. It resolves `.lnk` shortcuts using native COM object `WScript.Shell` and returns a JSON array of files: `[{name, path, isShortcut, target}]`. Ensure output is parsed correctly as an array in Node.
   - `POST /api/win/launch`: Secures input targets by validating against shell command injection operators `[&|;$\n\r`<>]/`. Defines a whitelist of safe/standard built-in Windows applications: `notepad`, `calc`, `explorer`, `cmd`, `powershell`, `taskmgr`, `mspaint`, `write` (with or without `.exe`). If the parsed target filename matches the whitelist, launch it directly using `child_process.execFile` calling `cmd.exe` with `['/c', 'start', '', target]`. Otherwise, display an interactive confirmation dialog using PowerShell's COM `Popup` function with a 15-second timeout. If the user allows it (exit code 0), proceed with launch; otherwise, return a `403 Forbidden` response.
2. Create `verify_bridge.js` at the project root using CommonJS format. The script must:
   - Hit `GET /api/desktop/files` and verify it returns a valid JSON array.
   - Hit `POST /api/win/launch` with `{ "target": "notepad" }` and verify it launches Notepad and returns `{ "success": true }`.
3. Verify your work:
   - Start the bridge server in the background (using run_command or check if it's already running. If you start it, make sure to clean up or run it using a Node CLI command, e.g. `node apps/web/agent-bridge.js`).
   - Run `node verify_bridge.js` using PowerShell.
   - Run typecheck/lint in `apps/web` if needed (e.g. `npm run lint` or `npx tsc --noEmit` in `apps/web`) to make sure your changes did not break any TS/JS rules.
4. Record your changes in `changes.md` and write a detailed handoff report in `handoff.md` inside your working directory. The handoff must include:
   - Verification commands run and their exact console outputs.
   - Build/compile verification status.
   - A declaration that you complied with the layout in PROJECT.md.
