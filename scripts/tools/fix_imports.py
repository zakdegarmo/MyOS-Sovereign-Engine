path = r"apps/web/src/Existence/viz/BioForceGraph/SynergeticGraph.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()
c = c.replace("import { FractalDiveOverlay } from '../FractalDiveOverlay';", "import { FractalDiveOverlay } from '@Omni/components/FractalDiveOverlay';")
with open(path, "w", encoding="utf-8") as f:
    f.write(c)
print("FIXED_IMPORT")
