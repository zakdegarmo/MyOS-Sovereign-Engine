import re

def patch_system_hud():
    path = "apps/web/src/components/MaxOverlay/SystemHud.tsx"
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    norm = content.replace('\r\n', '\n')

    # 1. State
    state_anchor = "const { setActivePath } = useOntologicalContext();"
    state_code = """const { setActivePath } = useOntologicalContext();
    const [dualWorkstationActive, setDualWorkstationActive] = useState<boolean>(false);

    const toggleDualWorkstation = () => {
        const next = !dualWorkstationActive;
        setDualWorkstationActive(next);
        window.dispatchEvent(new CustomEvent('myos:toggle-workstation', { detail: { show: next } }));
    };"""

    if state_anchor in norm and "toggleDualWorkstation" not in norm:
        norm = norm.replace(state_anchor, state_code)
        print("Added toggleDualWorkstation state to SystemHud.tsx")

    # 2. Button before package-foundry
    btn_marker = "activeModuleId === 'package-foundry'"
    if btn_marker in norm and "Dual Workstation Prisms" not in norm:
        # Find the <HudButton block containing package-foundry
        idx = norm.find(btn_marker)
        # find '<HudButton' before idx
        btn_start = norm.rfind('<HudButton', 0, idx)
        if btn_start != -1:
            insertion = """<HudButton
                        active={dualWorkstationActive}
                        onClick={toggleDualWorkstation}
                        icon={<Code2 size={18} className={dualWorkstationActive ? 'text-cyan-300 animate-pulse' : 'text-cyan-400'} />}
                        label="Dual Workstation Prisms (Script Atelier & Terminal Watcher)"
                    />\n\n                    """
            norm = norm[:btn_start] + insertion + norm[btn_start:]
            print("Inserted Dual Workstation button before package-foundry in SystemHud.tsx")

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(norm)

if __name__ == "__main__":
    patch_system_hud()
