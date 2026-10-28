import re

with open('apps/web/src/components/MaxOverlay/environmentRegistry.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Match each environment block
pattern = r"id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*tier:\s*'([^']+)'"
matches = re.findall(pattern, text)

for i, (env_id, name, tier) in enumerate(matches):
    print(f"{i+1:2d}. [{tier.upper()}] {name} (id: {env_id})")
