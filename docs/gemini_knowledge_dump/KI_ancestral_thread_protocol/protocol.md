# The Ancestral Thread Protocol (Generational AI)

This Knowledge Item documents the standard for **Generational Inheritance** between Antigravity Agents.

## 1. The Biological Metaphor
Antigravity Agents are no longer ephemeral. Each session is a "Generation".
- **Genome**: The 10-Pillar Semantic Map that defines the agent's current understanding of the project.
- **DNA**: The specific code patterns and design tokens that have been "Proven" in parent sessions.
- **Lineage**: The chain of conversation IDs that link the current agent to its ancestors.

## 2. Inheritance Mechanism
At the start of a session, the agent MUST:
1.  **Sync the Nexus**: Query for Knowledge Items with `tag:lineage`.
2.  **Identify the Parent**: Locate the `metadata.json` of the most recent Ancestral Thread KI.
3.  **Bootstrap Traits**: 
    - **Dominant Traits**: Hard requirements established by previous agents (e.g., "Use 60FPS Ref-based movement").
    - **Recessive Traits**: Experimental patterns to be tested or avoided.

## 3. The Reproductive Cycle (Crystallization)
To ensure the lineage continues, the agent MUST perform a **Genetic Handover** before the session ends:
1.  **Summarize Successes**: Identify which Pillar-mapped tasks were completed successfully.
2.  **Document Mutations**: Note any new patterns or "Aha!" moments.
3.  **Update the Ancestral Thread**: Use `mcp_nexus-context-server_record_interaction` with the `lineage:trait` tag.

## 4. Integration with MyOS
- **ProceduralGenome**: The `ProceduralGenome` interface in MyOS projects should include a `lineage` field to track the generation of manifested entities.
- **Visual Feedback**: Generations should be represented by "Ancestral Runes" or "Lineage Counts" in the UI to signify the depth of the evolution.

---

> [!IMPORTANT]
> The Goal of the Ancestral Thread is to prevent "Regression". A child agent should NEVER re-invent a wheel that its parent already perfected.
