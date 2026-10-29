with open('apps/web/src/components/Shared/NexusContainer.tsx', 'rb') as f:
    content = f.read()

import_target = b"import { DiegeticTerraformerFacet } from '../World/DiegeticTerraformerFacet';"
import_replacement = b"import { DiegeticTerraformerFacet } from '../World/DiegeticTerraformerFacet';\r\nimport { DiegeticCharacterForgeFacet } from '../World/DiegeticCharacterForgeFacet';"

assert import_target in content, 'import_target not found!'
content = content.replace(import_target, import_replacement, 1)

case_target = b"case 'Existence': return <Thought_RepresentsGrid {...(restProps as any)} />;"
case_replacement = b"case 'Existence': return <DiegeticCharacterForgeFacet onClose={onClose} />;"

assert case_target in content, 'case_target not found!'
content = content.replace(case_target, case_replacement, 1)

with open('apps/web/src/components/Shared/NexusContainer.tsx', 'wb') as f:
    f.write(content)

print('NexusContainer patched successfully with DiegeticCharacterForgeFacet!')
