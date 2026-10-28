---
description: Systematically convert Semantic Prompts into Concrete Application Features.
---

# Workflow: Matrix Manifestation (The 100 Features)

This workflow guides the **Existence Agent** (Builder) and **Mastery Agent** (Executor) to process the Semantic Matrix and instantiate concrete code features.

## Prerequisites
- [x] `semantic_prompts.ts` exists and contains the 100 prompts.
- [x] `SemanticMatrix` UI is available for manual testing.
- [ ] `features/` directory exists in the codebase.

## The Cycle (Per Batch)

### 1. Selection (Focus)
Choose a specific **Relationship Vector** to work on. Do not try to do all 100 at once.
*   **Self-Referential**: The diagonal (Self->Self, Thought->Thought...) - *Identity Features*.
*   **The Logic Vector**: (Logic -> X) - *Constraint Features*.
*   **The Unity Vector**: (X -> Unity) - *Integration Features*.

### 2. Essence Extraction (Gemini)
Run the `semantic_prompt` for the selected cell(s) with the following "Manifestation Wrapper":

> **SYSTEM:** You are the Existence Agent.
> **INPUT:** Semantic Prompt: "{prompt}" (Verb: {verb})
> **TASK:** Translate this abstract relationship into a SINGLE, CONCRETE Software Feature for the Mystra Nexus application.
> **CONSTRAINTS:**
> 1. Must be a UI Component, a Background Service, or a Data Structure.
> 2. Must be implementable in React/TypeScript.
> 3. Must have a cool/mystical name.
> **OUTPUT JSON:**
> {
>   "name": "Feature Name",
>   "type": "UI | Service | Data",
>   "description": "User-facing description",
>   "technical_spec": "Brief implementation details",
>   "file_path": "Suggested file path"
> }

### 3. Documentation (The Grimoire)
Append the result to `features/semantic_backlog.md`.

### 4. Implementation (Crystallization)
Select the highest-value features from the batch and:
1.  Create the file (if new) or locate the component.
2.  Implement the logic or UI.
3.  Verify the "Verb" is satisfied (e.g. if "Structures", does it actually constrain?).

## Recommended Batches

### Batch A: The "Self" Loop (Identity)
- Self->Self (Journaling)
- Self->Thought (Stream Direction)
- Self->Logic (Values Constraint)

### Batch B: The "Logic" Governor (Stability)
- Logic->Self (Profile Validation)
- Logic->Thought (Syntax Checking)
- Logic->Existence (Testing)

### Batch C: The "Omni" Void (Space)
- Improvement->Omni (Garbage Collection)
- Thought->Omni (Idea Archiving)
- Existence->Omni (De-spawning)

## Execution Command
Use `/consult_existence` to trigger this workflow for a specific batch.
Example: "Run Matrix Manifestation for Batch A"
