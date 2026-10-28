---
description: Perform the Albedo (Purification) process on a codebase component.
---

1. **Analyze**: Identify the target component or module that requires purification (refactoring, type cleanup, standardization).
2. **Consult [Logic]**:
    - Identify loose types (`any`), dead code, and inconsistent naming.
    - Run linting checks.
3. **Consult [Improvement]**:
    - Propose optimizations for performance and readability.
    - Apply "MyOntology" schemas (e.g., standardizing on `UserGestalt` or `GraphNode`).
4. **Execute**:
    - Refactor the code.
    - Add strict TypeScript interfaces.
    - Remove designated "impurities" (dead code, console logs, legacy comments).
5. **Verify**: Ensure the component builds and runs without errors.
