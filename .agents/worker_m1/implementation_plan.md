# Implementation Plan - Backend Bridge Endpoints

## Goals
1. Implement `GET /api/desktop/files` in `apps/web/agent-bridge.js` to scan `C:\Users\zakde\Desktop` (with fallback) and resolve shortcuts.
2. Implement `POST /api/win/launch` in `apps/web/agent-bridge.js` with secure command-injection validation, standard Windows application whitelist, and PowerShell popup confirmation for non-whitelisted applications.
3. Create `verify_bridge.js` at the project root to test these endpoints.
4. Verify tests pass and there are no lint/compile errors.

## Proposed Changes

### `apps/web/agent-bridge.js`
- **GET request routing**:
  Add `/api/desktop/files` pathname handling. It will execute a PowerShell script via `exec` to:
    - Get Desktop path (check `C:\Users\zakde\Desktop` first, fallback to `[System.Environment]::GetFolderPath('Desktop')`).
    - Fetch list of files.
    - Resolve `.lnk` files using `New-Object -ComObject WScript.Shell`.
    - Return `[{name, path, isShortcut, target}]` JSON array.
- **POST request routing**:
  Add `/api/win/launch` pathname handling.
    - Retrieve `{ target }` from post body.
    - Secure input target against shell command injection operators: `[&|;$\n\r`<>]/`. If matches, return error or deny.
    - Define whitelist: `notepad`, `calc`, `explorer`, `cmd`, `powershell`, `taskmgr`, `mspaint`, `write` (with or without `.exe` suffix).
    - If target matches whitelist (case-insensitive, optionally with `.exe`), launch it directly using `child_process.execFile` (or we can use `child_process.execFile('cmd.exe', ['/c', 'start', '', target])`).
    - If not whitelisted:
      - Display interactive confirmation dialog using PowerShell's COM `Popup` function with 15-second timeout:
        `$ws = New-Object -ComObject WScript.Shell; $ws.Popup('Do you want to launch [target]?', 15, 'Confirm Launch', 4 + 32)`
        Note: Button combination `4` is "Yes" and "No". Icon `32` is Question mark.
        If user clicks "Yes", it returns `6`. If timeout, it returns `-1`. If "No", it returns `7`.
      - Check exit/return code. If Yes (6), proceed with launch. Otherwise return `403 Forbidden`.

### `verify_bridge.js`
- Use CommonJS format.
- Run tests against `GET /api/desktop/files` and `POST /api/win/launch` with "notepad".
- Print results and assert conditions.

## Verification
- Run agent-bridge.js server locally in background.
- Run `verify_bridge.js` using node.
- Kill background bridge server after verification.
