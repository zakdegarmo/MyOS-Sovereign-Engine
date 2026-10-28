# Changes

## Modified Files
- `apps/web/agent-bridge.js`

## Security and Robustness Enhancements

### 1. Whitelist Basename Bypass Fix
- **Vulnerability**: The previous whitelist check analyzed only the basename of the command target. This allowed a malicious command from an untrusted location (e.g. `C:\Users\zakde\Downloads\calc.exe`) to match the basename `calc.exe` -> `calc`, bypassing the confirmation prompt because it was in the whitelist.
- **Fix**: Modified the whitelist check to check if the target has no directory separators (`\` or `/`), indicating it is a bare command name (e.g., `notepad` or `calc.exe` without paths).
- **Code Change**:
  ```javascript
  const isBareName = !target.includes('\\') && !target.includes('/');
  const isWhitelisted = isBareName && whitelist.has(nameWithoutExt);
  ```

### 2. Sibling Directory Jailbreak Fix
- **Vulnerability**: `isSafePath` verified folder containment using path prefix matching (`startsWith`). Since it did not verify the path separator boundaries, sibling folders with overlapping prefixes (e.g., `MyOS-malicious-sibling`) could jailbreak.
- **Fix**: Added the `isPathInside(parentPath, childPath)` helper function, which resolves the paths, converts to lower case, and checks if they are equal or if the child path starts with the parent path followed by the path separator (`path.sep`).
- **Code Change**:
  ```javascript
  function isPathInside(parentPath, childPath) {
      const prefixLower = path.resolve(parentPath).toLowerCase();
      const resolvedLower = path.resolve(childPath).toLowerCase();
      if (resolvedLower === prefixLower) return true;
      return resolvedLower.startsWith(prefixLower + path.sep);
  }
  ```
  And updated `isSafePath` to use `isPathInside` for verifying project jail boundaries (`isInsideProject`, `isGeminiDir`, `isDownloadsDir`, and `isDesktopDir`).

### 3. Recursive Symlink Scanning Fix
- **Vulnerability**: `scanSector` used `fs.stat(fullPath)`, which resolves symlinks. This could result in directory traversal or infinite recursion loops if a symbolic link points to a parent/sibling directory.
- **Fix**: Replaced `fs.stat(fullPath)` with `fs.lstat(fullPath)`. If the file is a symbolic link (`stat.isSymbolicLink()`), it is skipped (neither scanned nor recursed).
- **Code Change**:
  ```javascript
  const stat = await fs.lstat(fullPath);
  if (stat && stat.isSymbolicLink()) continue;
  ```
