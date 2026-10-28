# SHADOW PROTOCOL: The Unfucking Crew
## DESCRIPTION
When the system drifts into entropy, or when you simply suspect the codebase is rot with invisible debt, invoke the Shadowrunners. This protocol deploys a team of specialized scripts to analyze, report, and eventually auto-fix the "Shadow State" of the Nexus.

## THE CREW
1.  **Grep-0 (The Janitor)**: Scans for noise (`console.log`), dead files, and detritus.
2.  **Lint-Walker (The Surgeon)**: Hunts for `TODO`, `FIXME`, and structural fractures.
3.  **Type-Wraith (The Oracle)**: Checks for `any` types and large file complexity.

## DEPLOYMENT
To deploy the crew, run the following command in your terminal:

```bash
node scripts/shadow_runner.js
```

## INTERPRETING THE REPORT
- **Noise (Logs)**: If high (>50), consider running a `sed` removal command or manually cleaning `Studio3D.tsx`.
- **Debt (TODOs)**: These are your backlog items frozen in carbonite. Thaw them or destroy them.
- **Fractures (FIXMEs)**: These are active wounds. **Prioritize immediately**.
- **Heavy Constructs**: Files over 50KB. These are candidates for `Refactoring` by the **Logic Agent**.

## ADVANCED OPERATIONS (Manual)
If the shadow report returns critical failures, you may engage the following specialized commands:

### 1. The Silence (Remove all console logs)
*Warning: Destructive.*
```bash
# Requires sed or equivalent tool
grep -r "console.log" .
```

### 2. The Purge (Find large node_modules)
```bash
du -sh node_modules/* | sort -rh | head -10
```

## THE OATH
*We serve in the dark to secure the light. We are the error handlers. We are the finally block.*
