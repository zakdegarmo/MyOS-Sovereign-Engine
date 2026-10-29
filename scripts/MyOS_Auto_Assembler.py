# MyOS_Auto_Assembler.py
# Version: 1.0.0
# Purpose: Performs an intelligent, automated, project-wide reorganization of the MyOS codebase
# by tracing dependencies and co-locating functional components into a clean, new architecture.

import os
import shutil
import re
import json
from collections import defaultdict

# --- Configuration ---
# All paths should be absolute to avoid ambiguity. Use raw strings (r"...") for Windows paths.
MYOS_ROOT = r"C:\My0S"

# Directories to recursively scan for files to organize.
SOURCE_DIRECTORIES_TO_SCAN = [
    MYOS_ROOT,
    r"C:\Users\zakde\Desktop\SORTING"
]

# Directory names to completely skip during the scan.
EXCLUDE_DIR_NAMES = [
    "node_modules", ".git", ".next", ".vs", "__pycache__",
    "_ARCHIVE_OldVersions", "_UNSORTED_ARCHIVE_TEMP", "ORGANIZED_BY_FILETYPE",
    "temp_purge_zone", "dist", "build"
]

# Critical files that must remain in the MYOS_ROOT directory.
CORE_MYOS_FILES_TO_KEEP_AT_ROOT = [
    os.path.join(MYOS_ROOT, "mystra_llm_core.js"),
    os.path.join(MYOS_ROOT, "package.json"),
    os.path.join(MYOS_ROOT, "package-lock.json"),
]

# Defines the primary top-level organizational structure for Agents.
AGENT_ROOTS = {
    "MystraData": os.path.join(MYOS_ROOT, "MystraData"),
    "Melvin": os.path.join(MYOS_ROOT, "Users", "2 Melvin"),
    "Aristotle": os.path.join(MYOS_ROOT, "Users", "3 Aristotle"),
    "Averroes": os.path.join(MYOS_ROOT, "Users", "4 Averroes"),
    "Rene": os.path.join(MYOS_ROOT, "Users", "5 Rene"),
    "Charles": os.path.join(MYOS_ROOT, "Users", "6 Charles"),
    "Max": os.path.join(MYOS_ROOT, "Users", "7 Max"),
}

# Defines the known functional components, their owners, and their seed files.
# This is the brain of the assembler.
COMPONENT_DEFINITIONS = [
    # Melvin's Core Pipeline
    {
        "name": "MelvinCoreService", "target_agent": "Melvin", "target_sub_dir": "servers_js",
        "seed_files": ["MelvinSort.js", "database_manager.js", "ingest-memory.js"]
    },
    {
        "name": "MelvinPythonScripts", "target_agent": "Melvin", "target_sub_dir": "scripts_python",
        "seed_files": ["SummerEyes.py", "CreateLibrary.py", "CreateMatrixIndex.py", "CreateMatrixIndex_WithFiles.py", "ProcessDeweyIndex.py", "ProcessDeweyIndex2.py", "create_json_file_index1.py", "Genesis_Engine_NLBL.py"]
    },
    {
        "name": "MelvinLibraryData", "target_agent": "Melvin", "target_sub_dir": "data",
        "seed_files": ["pantheon_memory.db"] # Note: Directories like 'CardCat' will be handled by moving files within them.
    },
    # Averroes' Core Routing
    {
        "name": "AverroesMainRouter", "target_agent": "Averroes", "target_sub_dir": "servers_js",
        "seed_files": ["MyServer.js", "nexus.js", "api_integrations.js", "archive_manager.js"]
    },
    # Charles's System Management
    {
        "name": "CharlesSwerver", "target_agent": "Charles", "target_sub_dir": "servers_js",
        "seed_files": ["Swerver.js", "Swerver (2).js", "Swerver (3).js", "SwerverNEWEST.js"]
    },
    {
        "name": "CharlesSystemScripts", "target_agent": "Charles", "target_sub_dir": "scripts_python",
        "seed_files": ["desktop_agent.js", "MyOS.ini", "ngrok.yml", "vite.config.ts", "consolidate-packages.js"]
    },
    # Rene's Generators
    {
        "name": "ReneGenerators", "target_agent": "Rene", "target_sub_dir": "scripts_python",
        "seed_files": ["familiar.main.py", "infinite_content_generator.py"]
    },
    # Max's Frontend/Visualizer
    {
        "name": "MaxFrontendApp", "target_agent": "Max", "target_sub_dir": "frontend_app_root",
        "seed_files": ["page.tsx", "OntoFractoViewer2.html", "logos-companion.js", "TextFileViewer.tsx", "next.config.js"]
    },
    {
        "name": "MaxMediaServices", "target_agent": "Max", "target_sub_dir": "servers_js",
        "seed_files": ["server.js"] # Specific to the OBS Gemini Bridge
    },
    # Shared Utilities (Agent: None -> goes into a global shared folder)
    {
        "name": "SharedPythonUtilities", "target_agent": None, "target_sub_dir": os.path.join("shared_utilities", "python"),
        "seed_files": ["grub_oclc.py", "bulette_grubber.py", "reindex_nlds.py", "gatewarden_scribe.py"]
    },
    {
        "name": "SharedJSUtilities", "target_agent": None, "target_sub_dir": os.path.join("shared_utilities", "js"),
        "seed_files": ["initial_boot_logic.js", "nld_handlers.js", "ontological_math.js", "state.js", "utils.js", "app_state_manager.js", "config.js"]
    },
]

# Regex to find JS/TS and Python imports/requires. Handles various quoting.
DEP_REGEX = re.compile(
    r"""import\s.*?from\s*['"](\./.*?|../.*?)['"]|"""  # import ... from './relative'
    r"""require\(['"](\./.*?|../.*?)['"]\)|"""          # require('./relative')
    r"""from\s+(\.\w+)\s+import|"""                     # from .module import
    r"""import\s+(\.\w+)"""                            # import .module
, re.MULTILINE)

# --- Core Logic ---

def build_file_inventory():
    """
    Recursively scans source directories to build a master dictionary of all files
    and their content, respecting exclusion rules.
    """
    print("Phase 1: Building file inventory...")
    all_files_metadata = {}
    normalized_core_files = {os.path.normpath(f) for f in CORE_MYOS_FILES_TO_KEEP_AT_ROOT}

    for source_dir in SOURCE_DIRECTORIES_TO_SCAN:
        if not os.path.isdir(source_dir):
            print(f"  [WARN] Source directory not found, skipping: {source_dir}")
            continue
        for root, dirnames, filenames in os.walk(source_dir, topdown=True):
            # Crucial exclusion logic
            dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIR_NAMES]

            for filename in filenames:
                original_path = os.path.normpath(os.path.join(root, filename))
                if original_path in normalized_core_files:
                    continue # Skip core files

                content = None
                try:
                    # Only read content of text-based files for dependency tracing
                    if filename.endswith(('.js', '.ts', '.tsx', '.py', '.html', '.css', '.json')):
                        with open(original_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                except Exception as e:
                    print(f"  [WARN] Could not read file {original_path}: {e}")

                all_files_metadata[original_path] = {
                    "filename": filename,
                    "content": content
                }
    print(f"  -> Found {len(all_files_metadata)} files to process.\n")
    return all_files_metadata

def extract_dependencies(file_content, current_file_path, all_files_metadata):
    """Parses file content to find relative dependencies and resolves them to absolute paths."""
    dependencies = set()
    if not file_content:
        return dependencies

    for match in DEP_REGEX.finditer(file_content):
        # The regex has multiple capture groups, find the one that matched.
        rel_path_str = next((g for g in match.groups() if g is not None), None)
        if not rel_path_str:
            continue

        # Handle Python's dot notation (e.g., from .utils import)
        if rel_path_str.startswith('.'):
            # A simple implementation: assumes .utils corresponds to utils.py
            # This could be expanded to handle packages more robustly.
            base = rel_path_str.lstrip('.')
            possible_filenames = [f"{base}.py", f"{base}.js"] # Check for both
        else:
            possible_filenames = [os.path.basename(rel_path_str)]

        # Resolve the relative path to an absolute path
        abs_path_base = os.path.normpath(os.path.join(os.path.dirname(current_file_path), os.path.dirname(rel_path_str)))

        found = False
        for fname in possible_filenames:
            potential_abs_path = os.path.join(abs_path_base, fname)
            if potential_abs_path in all_files_metadata:
                dependencies.add(potential_abs_path)
                found = True
                break
        # if not found:
        #     print(f"  [DEBUG] Could not resolve dependency '{rel_path_str}' from '{current_file_path}'")

    return dependencies


def map_files_to_components(all_files_metadata):
    """
    Traces dependencies from seed files to assign every file to a component.
    Handles conflicts by flagging files for copying.
    """
    print("Phase 2: Mapping files to components via dependency tracing...")
    file_assignments = {} # {original_path: component_name}
    component_file_map = defaultdict(set)
    # Create a quick lookup for filename -> original_path
    filename_to_path_map = defaultdict(list)
    for path, meta in all_files_metadata.items():
        filename_to_path_map[meta["filename"]].append(path)

    for component in COMPONENT_DEFINITIONS:
        comp_name = component["name"]
        print(f"  -> Tracing component: {comp_name}")
        queue = []
        visited = set()

        # Find and add seed files to the queue
        for seed in component["seed_files"]:
            if seed in filename_to_path_map:
                for path in filename_to_path_map[seed]:
                    if path not in visited:
                        queue.append(path)
                        visited.add(path)

        # Start dependency tracing (BFS)
        while queue:
            current_path = queue.pop(0)
            component_file_map[comp_name].add(current_path)

            # Assign file to component, checking for conflicts
            if current_path in file_assignments and file_assignments[current_path] != comp_name:
                # This file is already claimed, mark it as shared
                print(f"    [CONFLICT] Shared file detected: {os.path.basename(current_path)} is shared between '{file_assignments[current_path]}' and '{comp_name}'. It will be copied.")
                # We can add special handling here if needed, for now just note it.
            else:
                file_assignments[current_path] = comp_name

            # Find and add dependencies to the queue
            meta = all_files_metadata.get(current_path, {})
            dependencies = extract_dependencies(meta.get("content"), current_path, all_files_metadata)
            for dep_path in dependencies:
                if dep_path not in visited:
                    visited.add(dep_path)
                    queue.append(dep_path)

    print("  -> Component mapping complete.\n")
    return file_assignments, component_file_map


def generate_and_confirm_plan(file_assignments, all_files_metadata):
    """
    Generates a full report of proposed changes and asks for user confirmation.
    """
    print("Phase 3: Generating execution plan (Dry Run)...")
    plan = defaultdict(list)
    orphans = []
    shared_files = defaultdict(list)
    final_moves = {} # {original_path: new_path}

    # First, identify all shared files
    path_counts = defaultdict(int)
    for comp_name, files in file_assignments.items():
        for path in files:
             path_counts[path] += 1
    shared_paths = {path for path, count in path_counts.items() if count > 1}


    # Generate the plan
    for original_path, comp_name in file_assignments.items():
        component_def = next((c for c in COMPONENT_DEFINITIONS if c["name"] == comp_name), None)
        if not component_def: continue

        agent_name = component_def["target_agent"]
        sub_dir = component_def["target_sub_dir"]

        if agent_name:
            dest_root = os.path.join(AGENT_ROOTS[agent_name], sub_dir)
        else: # Shared utility
            dest_root = os.path.join(MYOS_ROOT, sub_dir)

        new_path = os.path.join(dest_root, os.path.basename(original_path))
        final_moves[original_path] = new_path

        move_type = "COPY" if original_path in shared_paths else "MOVE"
        plan[comp_name].append(f"    - ({move_type}) {os.path.basename(original_path)}")

    # Find orphans
    for path in all_files_metadata:
        if path not in file_assignments:
            orphans.append(path)

    # Print the report
    print("="*50)
    print("MyOS Auto-Assembler: Execution Plan")
    print("="*50)
    for comp_name, actions in sorted(plan.items()):
        component_def = next((c for c in COMPONENT_DEFINITIONS if c["name"] == comp_name), None)
        agent_name = component_def["target_agent"]
        sub_dir = component_def["target_sub_dir"]
        dest_root = os.path.join(AGENT_ROOTS.get(agent_name, MYOS_ROOT), sub_dir) if agent_name else os.path.join(MYOS_ROOT, sub_dir)
        print(f"\nComponent: '{comp_name}' -> {dest_root}")
        for action in actions:
            print(action)

    if orphans:
        print("\nUncategorized Files (will be moved to _UNCATEGORIZED_TEMP):")
        for path in orphans:
            print(f"    - {path}")

    print("\n" + "="*50)
    print(f"Summary: {len(final_moves)} files to MOVE/COPY, {len(orphans)} uncategorized files.")
    print("WARNING: This operation will move files on your filesystem.")
    print("="*50)

    try:
        confirm = input("Do you want to execute this plan? (y/N): ")
        if confirm.lower() == 'y':
            return final_moves, orphans, shared_paths
        else:
            print("Execution aborted by user.")
            return None, None, None
    except KeyboardInterrupt:
        print("\nExecution aborted by user.")
        return None, None, None


def execute_relocation(final_moves, orphans, shared_paths):
    """
    Performs the actual file moves and copies based on the confirmed plan.
    """
    print("\nPhase 4: Executing relocation...")
    moved_count = 0
    copied_count = 0
    error_count = 0

    # Create all destination directories first
    all_dest_dirs = {os.path.dirname(p) for p in final_moves.values()}
    uncategorized_dir = os.path.join(MYOS_ROOT, "_UNCATEGORIZED_TEMP")
    all_dest_dirs.add(uncategorized_dir)
    for d in all_dest_dirs:
        os.makedirs(d, exist_ok=True)

    # Process moves and copies
    for original_path, new_path in final_moves.items():
        try:
            if original_path in shared_paths:
                shutil.copy2(original_path, new_path)
                copied_count += 1
                print(f"  [COPIED] {original_path} -> {new_path}")
            else:
                shutil.move(original_path, new_path)
                moved_count += 1
                print(f"  [MOVED] {original_path} -> {new_path}")
        except Exception as e:
            error_count += 1
            print(f"  [ERROR] Failed to process {original_path}: {e}")

    # Process orphans
    for path in orphans:
        try:
            shutil.move(path, os.path.join(uncategorized_dir, os.path.basename(path)))
            moved_count += 1
        except Exception as e:
            error_count += 1
            print(f"  [ERROR] Failed to move orphan {path}: {e}")

    print("\n--- Relocation Complete ---")
    print(f"Files Moved: {moved_count}")
    print(f"Files Copied (Shared): {copied_count}")
    print(f"Errors: {error_count}")


def main():
    """Main function to orchestrate the assembly process."""
    print("--- MyOS Auto-Assembler Initializing ---")
    
    # Phase 1
    all_files_metadata = build_file_inventory()

    # Phase 2
    file_assignments, _ = map_files_to_components(all_files_metadata)

    # Phase 3
    final_moves, orphans, shared_paths = generate_and_confirm_plan(file_assignments, all_files_metadata)

    # Phase 4
    if final_moves:
        execute_relocation(final_moves, orphans, shared_paths)
    
    print("\n--- MyOS Auto-Assembler Finished ---")


if __name__ == "__main__":
    main()
