---
description: "A strict protocol for evaluating heavy anomalies and rescuing data safely."
---

# Archivist Data Rescue Workflow

**Description:** Use this workflow to evaluate legacy data from `C:\Users`, `Downloads`, or `N:\` without risking blind deletion.

## 1. Target Acquisition
Identify the heavy data anomaly (e.g., a folder > 100MB).

## 2. Context Extraction
Run read-only tools (`list_dir`, `view_file`) on the target to extract:
1. Dependencies (`package.json`)
2. Stated purpose (`README.md`)
3. Core logic structures (Sample `.ts` or `.py` files)

## 3. Mandatory Codebase Cross-Reference
You MUST use your search tools to grep `apps/web/src` for unique class names, functions, or UI elements found in the target. Prove whether it is already integrated into MyOS.

## 4. Integration Analysis
Present a verdict to the Quill Operator:
- **Already Integrated / Dead End:** Redundant logic. Advise packaging losslessly to `N:\MyOS_Archives`.
- **Not Integrated, Valuable:** Evaluate against the 10 Pillars and advise moving to `public/integrations/[Pillar]`.
