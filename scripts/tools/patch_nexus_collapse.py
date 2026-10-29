with open('apps/web/src/components/Shared/NexusContainer.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
old_str = "case 'Omni': return <Transcendence_IsTheNatureOfGrid {...(restProps as any)} />;"
new_str = "case 'Omni': return <DiegeticCollapsePredictorFacet onClose={onClose} />;"
assert old_str in content, 'Target string not found!'
content = content.replace(old_str, new_str, 1)
with open('apps/web/src/components/Shared/NexusContainer.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('NexusContainer updated successfully!')
