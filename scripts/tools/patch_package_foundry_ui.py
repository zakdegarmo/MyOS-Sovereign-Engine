import os

# 1. Patch MaxOverlay.tsx
max_overlay_path = r"apps/web/src/components/MaxOverlay/MaxOverlay.tsx"
with open(max_overlay_path, "r", encoding="utf-8") as f:
    max_overlay = f.read()

norm_mo = max_overlay.replace("\r\n", "\n")

import_target = "import { AetherConsole } from './AetherConsole';"
import_replacement = """import { AetherConsole } from './AetherConsole';
import { PackageFoundry } from '../Apps/PackageFoundry';"""

render_target = """                {activeModuleId === 'aether-console' && (
                    <AetherConsole onClose={() => setActiveModuleId(null)} />
                )}"""
render_replacement = """                {activeModuleId === 'aether-console' && (
                    <AetherConsole onClose={() => setActiveModuleId(null)} />
                )}
                {activeModuleId === 'package-foundry' && (
                    <PackageFoundry onClose={() => setActiveModuleId(null)} />
                )}"""

if import_target in norm_mo and render_target in norm_mo:
    norm_mo = norm_mo.replace(import_target, import_replacement)
    norm_mo = norm_mo.replace(render_target, render_replacement)
    with open(max_overlay_path, "w", encoding="utf-8") as f:
        f.write(norm_mo.replace("\n", "\r\n"))
    print("PATCHED_MAX_OVERLAY")
else:
    print("FAILED_MAX_OVERLAY")

# 2. Patch SystemHud.tsx
hud_path = r"apps/web/src/components/MaxOverlay/SystemHud.tsx"
with open(hud_path, "r", encoding="utf-8") as f:
    hud = f.read()

norm_hud = hud.replace("\r\n", "\n")

hud_import_target = "Monitor, Coffee, HelpCircle, Bug, Scroll, BookOpen, Cpu, HardDrive, Sparkles, Clapperboard, Compass,"
hud_import_replacement = "Monitor, Coffee, HelpCircle, Bug, Scroll, BookOpen, Cpu, HardDrive, Sparkles, Clapperboard, Compass, Package,"

hud_btn_target = """                    <HudButton
                        active={activeModuleId === 'state-manager'}
                        onClick={() => setActiveModuleId(activeModuleId === 'state-manager' ? null : 'state-manager')}
                        icon={<HardDrive size={18} className={activeModuleId === 'state-manager' ? 'text-amber-400' : ''} />}
                        label="Save / Load System State"
                    />"""

hud_btn_replacement = """                    <HudButton
                        active={activeModuleId === 'package-foundry'}
                        onClick={() => setActiveModuleId(activeModuleId === 'package-foundry' ? null : 'package-foundry')}
                        icon={<Package size={18} className={activeModuleId === 'package-foundry' ? 'text-emerald-300 animate-pulse' : 'text-emerald-400'} />}
                        label="Sovereign Package Foundry (NPM & PIP)"
                    />

                    <HudButton
                        active={activeModuleId === 'state-manager'}
                        onClick={() => setActiveModuleId(activeModuleId === 'state-manager' ? null : 'state-manager')}
                        icon={<HardDrive size={18} className={activeModuleId === 'state-manager' ? 'text-amber-400' : ''} />}
                        label="Save / Load System State"
                    />"""

if hud_import_target in norm_hud and hud_btn_target in norm_hud:
    norm_hud = norm_hud.replace(hud_import_target, hud_import_replacement)
    norm_hud = norm_hud.replace(hud_btn_target, hud_btn_replacement)
    with open(hud_path, "w", encoding="utf-8") as f:
        f.write(norm_hud.replace("\n", "\r\n"))
    print("PATCHED_SYSTEM_HUD")
else:
    print("FAILED_SYSTEM_HUD")

# 3. Patch NexusContainer.tsx
nexus_path = r"apps/web/src/components/Shared/NexusContainer.tsx"
with open(nexus_path, "r", encoding="utf-8") as f:
    nexus = f.read()

norm_nexus = nexus.replace("\r\n", "\n")

nexus_import_target = "import { SpriteLaboratory } from '../MaxOverlay/SpriteLaboratory';"
nexus_import_replacement = """import { SpriteLaboratory } from '../MaxOverlay/SpriteLaboratory';
import { PackageFoundry } from '../Apps/PackageFoundry';"""

nexus_route_target = "case 'Logic': return <Improvement_SystematizesGrid {...(restProps as any)} />;"
nexus_route_replacement = "case 'Logic': return <PackageFoundry isNested={true} onClose={onClose || (() => { })} />;"

if nexus_import_target in norm_nexus and nexus_route_target in norm_nexus:
    norm_nexus = norm_nexus.replace(nexus_import_target, nexus_import_replacement)
    norm_nexus = norm_nexus.replace(nexus_route_target, nexus_route_replacement)
    with open(nexus_path, "w", encoding="utf-8") as f:
        f.write(norm_nexus.replace("\n", "\r\n"))
    print("PATCHED_NEXUS_CONTAINER")
else:
    print("FAILED_NEXUS_CONTAINER")
