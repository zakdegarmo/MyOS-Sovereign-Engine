# Implementation Plan - Spatial OS Filesystem Bridge and HyperObject Launcher (Gen 2)

This plan details the steps to execute the project across the dual tracks using sub-orchestrators for delegation.

## Milestones and Decompositions

- **Milestone 1: Backend Bridge Security Fixes & Verification**
  - Delegate to `sub_orch_m1`.
  - Resolve three major security vulnerabilities found in Milestone 1:
    1. Whitelist Basename Bypass: Check if input target is a bare name (no directory separators `\` or `/`).
    2. Sibling Directory Jailbreak in `isSafePath`: Use prefix matching via a new helper `isPathInside(parentPath, childPath)`.
    3. Recursive Symlink Scanning in `scanSector`: Use `fs.lstat(fullPath)` and skip symbolic links.
  - Verify endpoints `/api/desktop/files` and `/api/win/launch` using `verify_bridge.js`.

- **Milestone 2: Spatial HyperObject Renderer**
  - Delegate to `sub_orch_m2`.
  - Map incoming desktop files and apps to 3D meshes in `AvatarScene.tsx` using a coordinate system layout.
  - Double-clicking a 3D file/folder mesh will launch its native counterpart via the bridge.
  - Clicking a 3D desktop folder mesh opens its sub-panel.
  - Fallback icon extraction or generic meshes if custom models are missing.

- **Milestone 3: Sandboxed Virtual Display Monitor**
  - Delegate to `sub_orch_m3`.
  - Render virtual display monitor mesh.
  - Integrate JS-DOS WASM environment in the virtual screen (hybrid local/CDN method).

- **Milestone 4: WebRTC Input & Security**
  - Delegate to `sub_orch_m4`.
  - WebRTC input relay for mouse/keyboard inputs.
  - Validate Peer Public Key ID before executing inputs.

- **Milestone 5: E2E Testing, Adversarial Verification, and Hardening**
  - Opaque-box E2E test verification and white-box adversarial coverage hardening.
  - Dual-track E2E Testing Track (`sub_orch_e2e`) runs in parallel to develop the E2E test suite.
  - Final integration milestone will pass 100% of the E2E test suite.
