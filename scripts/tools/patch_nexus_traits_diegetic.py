with open('apps/web/src/components/Shared/NexusContainer.tsx', 'rb') as f:
    content = f.read()

target = b"if (cached && cached.traits[root] && cached.traits[root][sub] && !(root === 'Self' && sub === 'Self')) {"
replacement = b"if (!restProps.isDiegeticScreen && cached && cached.traits[root] && cached.traits[root][sub] && !(root === 'Self' && sub === 'Self')) {"

assert target in content, 'Target condition not found!'
content = content.replace(target, replacement, 1)

with open('apps/web/src/components/Shared/NexusContainer.tsx', 'wb') as f:
    f.write(content)

print('NexusContainer patched line 1650 with !restProps.isDiegeticScreen!')
