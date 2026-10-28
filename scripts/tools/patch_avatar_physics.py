path = "apps/web/src/components/MaxOverlay/AvatarScene.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read().replace('\r\n', '\n')

# 1. Import
target_import = "import { DualWorkstationPrisms } from '../World/DualWorkstationPrisms';"
replacement_import = "import { DualWorkstationPrisms } from '../World/DualWorkstationPrisms';\nimport { SoundstagePhysicsProps } from '../World/SoundstagePhysicsProps';"

if target_import in c and "SoundstagePhysicsProps" not in c:
    c = c.replace(target_import, replacement_import)
    print("Added SoundstagePhysicsProps import to AvatarScene.tsx")

# 2. JSX Mount
target_jsx = "{/* DUAL DIEGETIC WORKSTATION PRISMS (Left: Script Atelier | Right: Execution Watcher) */}"
replacement_jsx = """{/* INTERACTIVE CANNON-ES RIGID BODY PHYSICS PROPS (Milestone 3) */}
                    <SoundstagePhysicsProps active={true} />

                    {/* DUAL DIEGETIC WORKSTATION PRISMS (Left: Script Atelier | Right: Execution Watcher) */}"""

if target_jsx in c and "<SoundstagePhysicsProps" not in c:
    c = c.replace(target_jsx, replacement_jsx)
    print("Mounted SoundstagePhysicsProps into AvatarScene.tsx")

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(c)
