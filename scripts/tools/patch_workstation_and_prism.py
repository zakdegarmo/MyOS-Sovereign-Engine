import os
import re

def patch_diegetic_prism_nav():
    path = "apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Update PILLAR_FLAGSHIP_APPS
    old_flagship = """const PILLAR_FLAGSHIP_APPS: Record<string, { appName: string; path: GemId[]; description: string }> = {
    Self: {
        appName: 'Sprite Laboratory',
        path: ['Self', 'Self'],
        description: 'Universal LPC Sprite Sheet Synthesizer & Modular Rigging'
    },
    Thought: {
        appName: 'Test Environment Hub',
        path: ['Thought', 'Thought'],
        description: 'Library Explorer, 4D Holo-Cortex & Faerun Tilemap Sandbox'
    },
    Logic: {
        appName: 'Cartridge Loader & Console',
        path: ['Logic', 'Logic'],
        description: 'Deterministic Cartridge Execution & Relic Logic Graph'
    },
    Unity: {
        appName: 'Avatar Roster',
        path: ['Unity', 'Unity'],
        description: 'Multi-Agent Swarm Orchestration & Collective Gestalt'
    },
    Existence: {
        appName: 'Domain Navigator',
        path: ['Existence', 'Existence'],
        description: 'Spatial Coordinate Engine & 3D Soundstage Topography'
    },
    Improvement: {
        appName: '16-Bit Theater',
        path: ['Improvement', 'Improvement'],
        description: 'Cinematic Reel Screening & Iterative Optimization Pipeline'
    },
    Mastery: {
        appName: 'Mission Map View',
        path: ['Mastery', 'Mastery'],
        description: 'Sovereign Objective Tracker & Task Execution Matrix'
    },
    Resonance: {
        appName: 'BBS Service',
        path: ['Resonance', 'Resonance'],
        description: 'P2P Synaptic Telemetry & Decentralized Relay Interlink'
    },
    Transcendence: {
        appName: 'Transcendence Action Grid',
        path: ['Transcendence', 'Transcendence'],
        description: 'Paradigm Leaps, Dimensional Shifter & Horizon Ascendance'
    },
    Omni: {
        appName: 'Omni Totality & Holo-Cortex',
        path: ['Omni', 'Omni'],
        description: 'Latent Space Unification & 100-Point Bi-directional Lattice'
    }
};"""

    new_flagship = """const PILLAR_FLAGSHIP_APPS: Record<string, { appName: string; path: GemId[]; description: string }> = {
    Self: {
        appName: 'Sprite Laboratory',
        path: ['Self', 'Self'],
        description: 'Universal LPC Sprite Sheet Synthesizer & Modular Rigging'
    },
    Thought: {
        appName: '4D Holo-Cortex & Test Hub',
        path: ['Thought', 'Omni'],
        description: '4D Cognitive Latent Matrix, Neural Vectors & Library Sandbox'
    },
    Logic: {
        appName: 'Cartridge Loader & Console',
        path: ['Logic', 'Logic'],
        description: 'Deterministic Cartridge Execution & Relic Logic Graph'
    },
    Unity: {
        appName: 'Avatar Roster',
        path: ['Unity', 'Unity'],
        description: 'Multi-Agent Swarm Orchestration & Collective Gestalt'
    },
    Existence: {
        appName: 'Domain Navigator',
        path: ['Existence', 'Existence'],
        description: 'Spatial Coordinate Engine & 3D Soundstage Topography'
    },
    Improvement: {
        appName: 'Sovereign Package Foundry',
        path: ['Improvement', 'Logic'],
        description: 'Dual NPM & PIP Sovereign Package Manager & Dependency Forge'
    },
    Mastery: {
        appName: 'Mission Map View',
        path: ['Mastery', 'Mastery'],
        description: 'Sovereign Objective Tracker & Task Execution Matrix'
    },
    Resonance: {
        appName: 'BBS Service',
        path: ['Resonance', 'Resonance'],
        description: 'P2P Synaptic Telemetry & Decentralized Relay Interlink'
    },
    Transcendence: {
        appName: 'Transcendence Action Grid',
        path: ['Transcendence', 'Transcendence'],
        description: 'Paradigm Leaps, Dimensional Shifter & Horizon Ascendance'
    },
    Omni: {
        appName: 'Synergetic Genome Force Graph',
        path: ['Omni', 'Omni'],
        description: '1,111-Node Torus Knot Genome Force Graph & Latent Space Unification'
    }
};"""

    # Normalize newlines
    norm_content = content.replace('\r\n', '\n')
    norm_old = old_flagship.replace('\r\n', '\n')
    norm_new = new_flagship.replace('\r\n', '\n')

    if norm_old in norm_content:
        norm_content = norm_content.replace(norm_old, norm_new)
        print("Patched PILLAR_FLAGSHIP_APPS in DiegeticPrismNav.tsx")
    else:
        print("WARNING: old_flagship not found in DiegeticPrismNav.tsx")

    # 2. Update screenPaths initialization to default to flagship app paths!
    old_init = """    const [screenPaths, setScreenPaths] = useState<Record<number, GemId[]>>(() => {
        const init: Record<number, GemId[]> = {};
        pillars.forEach((p, idx) => {
            init[idx] = [p.id]; // Start at canonical root for each pillar
        });
        return init;
    });"""

    new_init = """    const [screenPaths, setScreenPaths] = useState<Record<number, GemId[]>>(() => {
        const init: Record<number, GemId[]> = {};
        pillars.forEach((p, idx) => {
            init[idx] = (PILLAR_FLAGSHIP_APPS[p.id]?.path as GemId[]) || [p.id, p.id];
        });
        return init;
    });"""

    norm_old_init = old_init.replace('\r\n', '\n')
    norm_new_init = new_init.replace('\r\n', '\n')

    if norm_old_init in norm_content:
        norm_content = norm_content.replace(norm_old_init, norm_new_init)
        print("Patched screenPaths initialization in DiegeticPrismNav.tsx")
    else:
        print("WARNING: old_init not found in DiegeticPrismNav.tsx")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(norm_content)


def patch_avatar_scene():
    path = "apps/web/src/components/MaxOverlay/AvatarScene.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    norm_content = content.replace('\r\n', '\n')

    # 1. Add import for DualWorkstationPrisms
    import_target = "import { DiegeticDirectoryPrism } from '../World/DiegeticDirectoryPrism';"
    import_replacement = "import { DiegeticDirectoryPrism } from '../World/DiegeticDirectoryPrism';\nimport { DualWorkstationPrisms } from '../World/DualWorkstationPrisms';"

    if import_target in norm_content and "DualWorkstationPrisms" not in norm_content:
        norm_content = norm_content.replace(import_target, import_replacement)
        print("Added DualWorkstationPrisms import to AvatarScene.tsx")

    # 2. Add state and event listener
    state_target = "const [selectedPrismDir, setSelectedPrismDir] = useState<DesktopFile | null>(null);"
    state_replacement = """const [selectedPrismDir, setSelectedPrismDir] = useState<DesktopFile | null>(null);
    const [showDualWorkstation, setShowDualWorkstation] = useState<boolean>(false);

    useEffect(() => {
        const handleToggle = (e: any) => {
            setShowDualWorkstation(prev => (typeof e?.detail?.show === 'boolean' ? e.detail.show : !prev));
        };
        window.addEventListener('myos:toggle-workstation', handleToggle);
        return () => window.removeEventListener('myos:toggle-workstation', handleToggle);
    }, []);"""

    if state_target in norm_content and "showDualWorkstation" not in norm_content:
        norm_content = norm_content.replace(state_target, state_replacement)
        print("Added showDualWorkstation state to AvatarScene.tsx")

    # 3. Mount DualWorkstationPrisms in JSX
    jsx_target = "{/* DYNAMIC N-FACETED DIRECTORY PRISM (Unfurled from Desktop PrismaticTricon - Grounded on Floor Plane) */}"
    jsx_replacement = """{/* DUAL DIEGETIC WORKSTATION PRISMS (Left: Script Atelier | Right: Execution Watcher) */}
                    {showDualWorkstation && (
                        <DualWorkstationPrisms
                            position={[
                                (playerPos ? playerPos[0] : trackPos.x),
                                2.0,
                                (playerPos ? playerPos[2] : trackPos.z) - 5.0
                            ]}
                            onClose={() => setShowDualWorkstation(false)}
                        />
                    )}

                    {/* DYNAMIC N-FACETED DIRECTORY PRISM (Unfurled from Desktop PrismaticTricon - Grounded on Floor Plane) */}"""

    if jsx_target in norm_content and "<DualWorkstationPrisms" not in norm_content:
        norm_content = norm_content.replace(jsx_target, jsx_replacement)
        print("Mounted DualWorkstationPrisms in AvatarScene.tsx")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(norm_content)


def patch_system_hud():
    path = "apps/web/src/components/MaxOverlay/SystemHud.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    norm_content = content.replace('\r\n', '\n')

    # 1. Add toggleDualWorkstation handler
    state_target = "const { character, setCharacter, unlockTrait } = useOntologicalContext();"
    state_replacement = """const { character, setCharacter, unlockTrait } = useOntologicalContext();
    const [dualWorkstationActive, setDualWorkstationActive] = useState<boolean>(false);

    const toggleDualWorkstation = () => {
        const next = !dualWorkstationActive;
        setDualWorkstationActive(next);
        window.dispatchEvent(new CustomEvent('myos:toggle-workstation', { detail: { show: next } }));
    };"""

    if state_target in norm_content and "toggleDualWorkstation" not in norm_content:
        norm_content = norm_content.replace(state_target, state_replacement)
        print("Added toggleDualWorkstation to SystemHud.tsx")

    # 2. Add HUD button
    btn_target = """                    <HudButton
                        active={activeModuleId === 'package-foundry'}"""

    btn_replacement = """                    <HudButton
                        active={dualWorkstationActive}
                        onClick={toggleDualWorkstation}
                        icon={<Terminal size={18} className={dualWorkstationActive ? 'text-emerald-300 animate-pulse' : 'text-cyan-400'} />}
                        label="Dual Workstation Prisms (Script Editor & Watcher)"
                    />

                    <HudButton
                        active={activeModuleId === 'package-foundry'}"""

    if btn_target in norm_content and "label=\"Dual Workstation Prisms" not in norm_content:
        norm_content = norm_content.replace(btn_target, btn_replacement)
        print("Added Dual Workstation button to SystemHud.tsx")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(norm_content)

if __name__ == "__main__":
    patch_diegetic_prism_nav()
    patch_avatar_scene()
    patch_system_hud()
    print("All patches applied.")
