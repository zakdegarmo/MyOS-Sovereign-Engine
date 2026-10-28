path = "apps/web/src/components/Shared/NexusContainer.tsx"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
imported = False

for line in lines:
    if "import { HoloCortex4D } from '../CognitiveMatrix/HoloCortex4D';" in line:
        if not imported:
            new_lines.append(line)
            imported = True
        else:
            print("Removed duplicate HoloCortex4D import")
    else:
        new_lines.append(line)

with open(path, "w", encoding="utf-8", newline="\r\n") as f:
    f.writelines(new_lines)
print("Deduplicated imports in NexusContainer.tsx")
