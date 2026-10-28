---
description: Shapeshift the Orchestrator into a specific persona from the Persona Library
---

# /shapeshift Workflow

Morphs the Orchestrator avatar, system prompt, and ontological context into the specified persona.

## Usage
```
/shapeshift terry_davis
/shapeshift spock
/shapeshift logic.alan_turing
/shapeshift list
/shapeshift list logic
```

## Steps

1. Parse the persona argument:
   - If argument is `list`, display all available personas grouped by pillar
   - If argument is `list {pillar}`, display personas for that pillar only
   - If argument contains a dot (e.g. `logic.terry_davis`), parse as `{pillar}.{slug}`
   - Otherwise, search ALL_PERSONAS for a matching slug or name (case-insensitive)

2. Look up the persona using `getPersonaByPath(path)` from `src/memory/personaLibrary.ts`
   - If not found, respond: "No persona matching '{arg}' found. Try /shapeshift list"

3. Inject the persona system prompt:
   - Set `activePersona` state in the Orchestrator context
   - Prepend `persona.systemPromptFragment` to the beginning of the Tutor system prompt
   - The base system prompt follows after the persona fragment

4. Update the Orchestrator sprite genome:
   - Call `genomeFromPath('{pillar}.{slug}', personaManifest)` to generate a deterministic avatar
   - The `persona.genomeTags` array provides paperdoll layer hints for the genome engine
   - Update the Tutor sprite to render the new genome

5. Set the global ontological path:
   - Call `setActivePath('{pillar}.{slug}')` on the OntologicalContext
   - This updates the graph highlight, brain library context, and Tutor lore injection

6. Queue gossip lines:
   - Add `persona.gossipLines` to the ambient ChatBubble queue for the Tutor sprite
   - These play as ambient thoughts while the persona is active

7. Confirm the shapeshift in chat:
   - Respond in the persona's voice with a brief introduction
   - Example: (as Terry Davis) "The temple is open. What do you need solved?"

## Reverting

- `/shapeshift reset` or `/shapeshift omni` — returns to default Omni/Orchestrator persona
- The default persona slug is `omni.orchestrator`

## Notes

- Only one persona is active at a time
- The persona's `pillar` overrides the Orchestrator's home pillar in the system prompt
- Genome sprites are pre-computed deterministically — the same persona always produces the same sprite
- Gossip lines loop randomly while the persona is active, every 30–60 seconds
