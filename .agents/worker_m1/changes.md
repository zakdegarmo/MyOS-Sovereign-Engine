# Changes - Milestone 1: Backend Bridge

Implemented desktop file scanning and secure native launching on the agent bridge.

## Files Modified
### `apps/web/agent-bridge.js`
- Added imports for `execFile` from `child_process`.
- Implemented `GET /api/desktop/files` endpoint:
  - Runs a PowerShell script to scan files on the Desktop (fallbacks to `[System.Environment]::GetFolderPath('Desktop')`).
  - Resolves `.lnk` shortcuts using the `WScript.Shell` COM object.
  - Returns a JSON array of `[{ name, path, isShortcut, target }]`.
- Implemented `POST /api/win/launch` endpoint:
  - Sanitizes the input `target` using a regular expression to protect against shell injection: `/[&|;$\n\r`<>\/]/.test(target)`.
  - Defines a case-insensitive whitelist of built-in Windows applications: `notepad`, `calc`, `explorer`, `cmd`, `powershell`, `taskmgr`, `mspaint`, `write` (with or without `.exe`).
  - If whitelisted, launches directly using `child_process.execFile('cmd.exe', ['/c', 'start', '', target])`.
  - If not whitelisted, displays an interactive confirmation dialog with `WScript.Shell` `Popup` featuring a 15-second timeout.
  - If approved (exit code 0), launches the application. Otherwise, returns a `403 Forbidden` response.

## Files Created
### `verify_bridge.js`
- Created a CommonJS verification script at the project root to:
  - Perform `GET /api/desktop/files` and assert that a valid JSON array is returned.
  - Perform `POST /api/win/launch` with target `"notepad"` and assert that a `{ "success": true }` is returned.
