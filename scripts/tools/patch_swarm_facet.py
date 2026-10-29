import os

def patch():
    # 1. Patch NexusContainer.tsx
    nc_path = "apps/web/src/components/Shared/NexusContainer.tsx"
    with open(nc_path, "r", encoding="utf-8") as f:
        c = f.read().replace('\r\n', '\n')

    import_target = "import { AvatarRoster } from '../HUDModules/AvatarRoster';"
    import_replacement = "import { AvatarRoster } from '../HUDModules/AvatarRoster';\nimport { DiegeticSwarmManagerFacet } from '../World/DiegeticSwarmManagerFacet';"

    if import_target in c and "DiegeticSwarmManagerFacet" not in c:
        c = c.replace(import_target, import_replacement)

    # In Unity switch:
    case_target = "case 'Unity': return <AvatarRoster />;"
    case_replacement = "case 'Unity': return <DiegeticSwarmManagerFacet />;"

    if case_target in c:
        c = c.replace(case_target, case_replacement)
        print("Updated NexusContainer Unity.Unity to DiegeticSwarmManagerFacet")

    with open(nc_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(c)

    # 2. Patch DiegeticPrismNav.tsx
    dpn_path = "apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx"
    with open(dpn_path, "r", encoding="utf-8") as f:
        d = f.read().replace('\r\n', '\n')

    old_unity = """    Unity: {
        appName: 'Avatar Roster',
        path: ['Unity', 'Unity'],
        description: 'Multi-Agent Swarm Orchestration & Collective Gestalt'
    },"""

    new_unity = """    Unity: {
        appName: 'Diegetic Swarm Manager',
        path: ['Unity', 'Unity'],
        description: 'Multi-Agent Swarm Cognitive Loop, Hardware Telemetry & Task Dispatch'
    },"""

    if old_unity in d:
        d = d.replace(old_unity, new_unity)
        print("Updated DiegeticPrismNav Unity flagship app to Diegetic Swarm Manager")

    with open(dpn_path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(d)

if __name__ == "__main__":
    patch()
