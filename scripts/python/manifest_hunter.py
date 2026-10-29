import os
import json

def hunt_manifests(root_dir, output_file):
    inventory = {"python_reqs": [], "js_packages": []}
    
    # Avoid walking into massive build or environment directories
    black_holes = {'node_modules', '.venv', '.git', '__pycache__', 'dist', 'build'}
    
    found_count = 0
    print(f"Scanning: {root_dir}")
    
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in black_holes]
        
        for file in files:
            file_path = os.path.join(root, file)
            
            # Python requirements.txt
            if file == "requirements.txt":
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f_in:
                        deps = [line.strip() for line in f_in if line.strip() and not line.startswith('#')]
                        inventory["python_reqs"].append({"path": file_path, "libs": deps})
                        found_count += 1
                except:
                    pass

            # JS/Node package.json
            elif file == "package.json":
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f_in:
                        data = json.load(f_in)
                        deps = list(data.get("dependencies", {}).keys())
                        dev_deps = list(data.get("devDependencies", {}).keys())
                        all_deps = list(set(deps + dev_deps))
                        inventory["js_packages"].append({"path": file_path, "libs": all_deps})
                        found_count += 1
                except:
                    pass

    # Write Markdown Report
    with open(output_file, "w", encoding="utf-8") as f_out:
        f_out.write("# Local Workspace Library Manifest\n")
        f_out.write(f"**Scan Source:** `{root_dir}`\n\n")

        f_out.write("## Python Requirements\n")
        if not inventory["python_reqs"]:
            f_out.write("No Python manifests found.\n\n")
        for item in inventory["python_reqs"]:
            rel_path = os.path.relpath(item['path'], root_dir)
            f_out.write(f"### `{rel_path}`\n")
            f_out.write("- " + "\n- ".join(item['libs']) + "\n\n")

        f_out.write("## JS Packages\n")
        if not inventory["js_packages"]:
            f_out.write("No JS manifests found.\n\n")
        for item in inventory["js_packages"]:
            rel_path = os.path.relpath(item['path'], root_dir)
            f_out.write(f"### `{rel_path}`\n")
            f_out.write("- " + "\n- ".join(item['libs']) + "\n\n")

    print(f"Scan complete. Found {found_count} manifests. Saved to {output_file}")

if __name__ == "__main__":
    workspace_root = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(workspace_root, "LibsManifest.md")
    hunt_manifests(workspace_root, output_path)
