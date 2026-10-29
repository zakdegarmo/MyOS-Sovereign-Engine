with open('apps/web/src/components/Shared/NexusContainer.tsx', 'rb') as f:
    content = f.read()

import_target = b"import { DiegeticCharacterForgeFacet } from '../World/DiegeticCharacterForgeFacet';"
import_replacement = b"import { DiegeticCharacterForgeFacet } from '../World/DiegeticCharacterForgeFacet';\r\nimport { DiegeticShaderForgeFacet } from '../World/DiegeticShaderForgeFacet';"

assert import_target in content, 'import_target not found!'
content = content.replace(import_target, import_replacement, 1)

case_target = b"case 'Transcendence': return <Thought_EnablesGrid {...(restProps as any)} />;"
case_replacement = b"case 'Transcendence': return <DiegeticShaderForgeFacet onClose={onClose} />;"

assert case_target in content, 'case_target not found!'
content = content.replace(case_target, case_replacement, 1)

with open('apps/web/src/components/Shared/NexusContainer.tsx', 'wb') as f:
    f.write(content)

print('NexusContainer patched successfully with DiegeticShaderForgeFacet!')
