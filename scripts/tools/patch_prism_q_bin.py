with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'rb') as f:
    b = f.read()

target = b"""            } else if (e.key.toLowerCase() === 'd') {
                e.preventDefault();
                setScreenPaths(prev => ({
                    ...prev,
                    [activeFaceIdx]: ['Logic', 'Omni']
                }));"""

replacement = b"""            } else if (e.key.toLowerCase() === 'd') {
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

target_crlf = target.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
replacement_crlf = replacement.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')

assert target_crlf in b, 'Target CRLF not found!'
b = b.replace(target_crlf, replacement_crlf, 1)

with open('apps/web/src/components/MaxOverlay/DiegeticPrismNav.tsx', 'wb') as f:
    f.write(b)
print('Applied [Q] with exact CRLF line endings!')
