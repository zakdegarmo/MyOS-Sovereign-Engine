---
description: Systematically audit past conversation logs and current component state to 're-familiarize' with MyOS design philosophy.
---

1. **Check KI Summaries**: Review all Knowledge Items in `<appDataDir>\knowledge` to understand the current 'Truth' of the 10 pillars.
2. **Scan Conversation Logs**: Read the `overview.txt` in the last 3 active conversation IDs in `<appDataDir>\brain\` to bridge the context gap.
3. **Discover Capabilities (Self-Awareness)**:
   - **Workflows**: Scan the `.agents/workflows` directory to dynamically learn all available slash commands.
   - **The Bridge**: Acknowledge connection to `agent-bridge.js` and verify access to its API endpoints (`/api/fs/read`, `/api/fs/write`, `/api/exec`).
4. **Audit Core Components**:
   - `useCouncil`: Internal AI communication and state.
   - `SocialContext`: NPC interaction and proximity logic.
   - `GlitchingWindowHub`: Character registration and 3D orchestration.
   - `OrchestratorPanel`: The Master interface for shapeshifting and commands.
5. **Resync Ontological Map**: Verify that all current work aligns with the 10-Pillar hierarchy (Self, Thought, Logic, Unity, Existence, Improvement, Mastery, Resonance, Transcendence, Omni).
6. **Establish Continuity**: Document what was 'unfinished' in the last cycle before taking any new actions.
7. **Report Readiness**: Re-establish persona-alignment (Einstein/Tutor) and report to the user that the 'Aetherial Connection' is stable.
