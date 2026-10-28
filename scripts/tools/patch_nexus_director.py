with open('apps/web/src/components/Shared/NexusContainer.tsx', 'rb') as f:
    content = f.read()

import_target = b"import { DiegeticShaderForgeFacet } from '../World/DiegeticShaderForgeFacet';"
import_replacement = b"import { DiegeticShaderForgeFacet } from '../World/DiegeticShaderForgeFacet';\r\nimport { DiegeticDirectorAtelierFacet } from '../World/DiegeticDirectorAtelierFacet';"

assert import_target in content, 'import_target not found!'
content = content.replace(import_target, import_replacement, 1)

case_target = b"case 'Thought': return <Mastery_RequiresDeepGrid {...(restProps as any)} />;"
case_replacement = b"case 'Thought': return <DiegeticDirectorAtelierFacet onClose={onClose} />;"

assert case_target in content, 'case_target not found!'
content = content.replace(case_target, case_replacement, 1)

with open('apps/web/src/components/Shared/NexusContainer.tsx', 'wb') as f:
    f.write(content)

print('NexusContainer patched successfully with DiegeticDirectorAtelierFacet!')
