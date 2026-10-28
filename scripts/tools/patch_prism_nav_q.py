with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """            } else if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Logic', 'Omni']
                }));"""

replacement = """            } else if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Logic', 'Omni']
                }));
            } else if (e.key.toLowerCase() === 'q') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Transcendence', 'Omni']
                }));"""

# Normalize CRLF
content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')
replacement_norm = replacement.replace('\r\n', '\n')

assert target_norm in content_norm, 'Target not found in DiegeticPrismNav!'
content_norm = content_norm.replace(target_norm, replacement_norm, 1)

with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(content_norm.replace('\n', '\r\n'))

print('DiegeticPrismNav updated successfully with [Q]!')
