with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'rb') as f:
    content = f.read()

target = b"""            } else if (e.key.toLowerCase() === 'v') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Existence', 'Transcendence']
                }));"""

replacement = b"""            } else if (e.key.toLowerCase() === 'v') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Existence', 'Transcendence']
                }));
            } else if (e.key.toLowerCase() === 'b') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Thought', 'Existence']
                }));"""

target_crlf = target.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
replacement_crlf = replacement.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')

assert target_crlf in content, 'target_crlf not found in DiegeticPrismNav!'
content = content.replace(target_crlf, replacement_crlf, 1)

with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'wb') as f:
    f.write(content)

print('DiegeticPrismNav patched successfully with [B]!')
