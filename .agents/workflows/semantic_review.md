---
description: Systematically review and refine a Semantic Panel (Ontology Node).
---

# Semantic Panel Review Protocol

Use this workflow to audit, refine, and plan a specific Semantic Interface Panel.
Output a concise, smoothbrain explanation of your actions to the chat window as they are performed so that the user is aware of any hangs or issues. 
## 1. Status Check & Observation
**Goal**: unbiased assessment of the current state.
1.  Open the relevant file (e.g., `Self/Factors/Identity/All.tsx`).
2.  State:
    *   **What is it currently?** (e.g., "A Music Sequencer")
    *   **Is it broken?** (Lint/Runtime errors)
    *   **Is it lame?** (Subjective quality check)
    *   **Quick Update**: Output a concise, "smoothbrain" explanation of your actions to the chat window as they are performed so that the user is aware of any hangs or issues.
    *   **Is the UI/UX appealing/free of visual bugs and non functional components?** (Subjective quality check)
## 2. Ontological Audit
**Goal**: Check alignment with the Semantic Matrix.
1.  **Vector Check**: Does this fit the Row? (e.g., "Does a Music Sequencer fit 'Self'?")
2.  **Factor Check**: Does this fit the Column? (e.g., "Does it represent 'resonation'?")
3.  **Judgment**: `[MATCH]`, `[MISMATCH]`, or `[STRETCH]`.

## 3. The W5H Grounding
**Goal**: If [MISMATCH] or [STRETCH], strictly define the concept using the 6 Questions.
*   **WHO** is the agent/user here?
*   **WHAT** is the precise object of focus?
*   **WHEN** does this interaction happen?
*   **WHERE** does it conceptually exist?
*   **WHY** is it necessary?
*   **HOW** does it manifest via UI?

### 3b. The Materialization (Crucial)
*   **Visual Metaphor**: What *is* it? (e.g., A Nebula, A Clock, A Molecule). Avoid generic "Dashboards".
*   **Data Hook**: What real-time data drives it? (e.g., Token Count, Chat Sentiment, Git Graph). If no data exists, can we simulate it?

## 4. The Pivot Decision
**Goal**: Commit to a path.
*   **Path A: Polish**: It fits. Fix bugs and improve UI.
*   **Path B: Pivot**: The concept is wrong. Propose a new one based on W5H.
*   **Path C: Scrap**: It is garbage. Move code to `_scraps` and reset to placeholder.

## 5. Execution Plan
1.  **Update Backlog**: Edit `semantic_backlog.md` with the new/refined Item.
2.  **Update Task List**: Sync `task.md`.
3.  **Execute**: Enter EXECUTION mode to build/fix.