with open('apps/web/src/components/Shared/NexusContainer.tsx', 'rb') as f:
    content = f.read()

import_target = b"import { DiegeticCollapsePredictorFacet } from '../World/DiegeticCollapsePredictorFacet';"
import_replacement = b"import { DiegeticCollapsePredictorFacet } from '../World/DiegeticCollapsePredictorFacet';\r\nimport { DiegeticFightClubFacet } from '../World/DiegeticFightClubFacet';"

assert import_target in content, 'import_target not found!'
content = content.replace(import_target, import_replacement, 1)

case_target = b"case 'Logic': return <Mastery_AppliesPerfectedGrid {...(restProps as any)} />;"
case_replacement = b"case 'Logic': return <DiegeticFightClubFacet onClose={onClose} />;"

assert case_target in content, 'case_target not found!'
content = content.replace(case_target, case_replacement, 1)

with open('apps/web/src/components/Shared/NexusContainer.tsx', 'wb') as f:
    f.write(content)

print('NexusContainer patched successfully with DiegeticFightClubFacet!')
