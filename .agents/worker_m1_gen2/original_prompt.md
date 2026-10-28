## 2026-06-30T21:41:31Z
You are the Worker (Generation 2) for Milestone 1: Backend Bridge.
Your working directory (for metadata/plans/reports): c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_m1_gen2
Workspace root: c:\Users\zakde\Desktop\AntiGravity projects\MyOS

Objective:
Fix the security vulnerability and robustness issue found in the implementation of the backend bridge in `apps/web/agent-bridge.js`.

Vulnerabilities/Issues to Fix:
1. [Critical] PowerShell command injection in the interactive confirmation prompt:
   Currently, the confirmation popup script interpolates the target into a double-quoted PowerShell string:
   $ws.Popup("An agent is requesting to launch: ${escapedTarget}\n\nDo you want to allow this?", ...)
   Because double quotes inside the target (like `" + (Start-Process calc) + "`) are not blocked, PowerShell evaluates subexpressions immediately.
   Mitigation: Change the PowerShell popup string to use single quotes around the target string, e.g.:
   $ws.Popup('An agent is requesting to launch: ' + '${escapedTarget}' + "`n`nDo you want to allow this?", ...)
   Ensure that `escapedTarget` escapes single quotes by replacing them with two single quotes: `target.replace(/'/g, "''")`. Since PowerShell single quotes treat everything literally and use doubled single quotes for escaping, this makes it fully secure.

2. [Minor] Missing `-NoProfile` flag:
   Ensure all invocations of `powershell.exe` in `agent-bridge.js` (including `/api/desktop/files` and `/api/win/launch` endpoints) run with the `-NoProfile` argument (e.g. `powershell.exe -NoProfile -Command "..."` or using `execFile('powershell.exe', ['-NoProfile', '-Command', psCommand])` or similar) to prevent custom user profiles from printing output to stdout and breaking JSON parsing.

Instructions:
- Carefully modify `apps/web/agent-bridge.js` to implement these fixes.
- Run `verify_bridge.js` to ensure that standard functionality works.
- Verify that the injection attempt target: `" + (Start-Process calc) + "` is safely handled and does NOT execute Calculator without approval.
- Record your changes in `changes.md` and write a detailed handoff report in `handoff.md` in your working directory. Include verification commands run and their exact outputs.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Use PowerShell syntax for all terminal commands. When done, call send_message to report completion to the orchestrator.
