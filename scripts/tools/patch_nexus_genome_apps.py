nexus_path = r"apps/web/src/components/Shared/NexusContainer.tsx"
with open(nexus_path, "r", encoding="utf-8") as f:
    text = f.read()

norm = text.replace("\r\n", "\n")

import_target = "import { PackageFoundry } from '../Apps/PackageFoundry';"
import_replacement = """import { PackageFoundry } from '../Apps/PackageFoundry';
import SynergeticGraph from '../../Existence/viz/BioForceGraph/SynergeticGraph';
import { HoloCortex4D } from '../CognitiveMatrix/HoloCortex4D';"""

# In Omni root:
omni_target = "case 'Omni': return <Omni_IsGrid {...(restProps as any)} />;"
omni_replacement = "case 'Omni': return <SynergeticGraph />;"

# In Thought root:
thought_omni_target = "case 'Omni': return <Thought_TranscendsGrid {...(restProps as any)} />;"
thought_omni_replacement = "case 'Omni': return <HoloCortex4D onClose={onClose} />;"

if import_target in norm and omni_target in norm and thought_omni_target in norm:
    norm = norm.replace(import_target, import_replacement)
    norm = norm.replace(omni_target, omni_replacement)
    norm = norm.replace(thought_omni_target, thought_omni_replacement)
    with open(nexus_path, "w", encoding="utf-8") as f:
        f.write(norm.replace("\n", "\r\n"))
    print("PATCHED_NEXUS_GENOME_APPS")
else:
    print("FAILED_TARGET_NOT_FOUND")
    if import_target not in norm: print("import_target missing")
    if omni_target not in norm: print("omni_target missing")
    if thought_omni_target not in norm: print("thought_omni_target missing")
