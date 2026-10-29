import os
import json

def build_genome_map(root_dir, ignored_dirs=['node_modules', '.git', 'dist', '.next']):
    genome = {}
    for root, dirs, files in os.walk(root_dir):
        # Filter ignored directories
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        # Calculate relative path as our "Pillar/Matrix" address
        rel_path = os.path.relpath(root, root_dir)
        genome[rel_path] = {
            "files": files,
            "subdirectories": dirs
        }
    return genome

root_path = os.getcwd()
genome_data = build_genome_map(root_path)

# Output for the chat