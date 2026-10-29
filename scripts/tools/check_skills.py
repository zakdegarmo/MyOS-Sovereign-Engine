import os
import yaml

def check_dir(base):
    for root, dirs, files in os.walk(base):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'SKILL.md' in files:
            path = os.path.join(root, 'SKILL.md')
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            if not content.startswith('---'):
                print(f"NO FRONTMATTER: {path}")
                continue
            parts = content.split('---', 2)
            if len(parts) < 3:
                print(f"MALFORMED: {path}")
                continue
            try:
                meta = yaml.safe_load(parts[1])
                name = meta.get('name')
                print(f"OK: {name} in {os.path.basename(root)}")
            except Exception as e:
                print(f"FAIL: {path} -> {e}")

if __name__ == '__main__':
    check_dir(r'C:\Users\zakde\.gemini\config\skills')
    check_dir(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agent')
    check_dir(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents')
    check_dir(r'c:\Users\zakde\Desktop\AntiGravity projects\MyOS\packages\glyphrider\.agent')
