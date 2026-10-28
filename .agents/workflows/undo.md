---
description: Revert the last set of changes made by the assistant.
---

// turbo-all
1. Use `git checkout -- <file>` to revert the last modified files in reverse order of their modification time.
2. If the user specifies "all", revert the last 7 files (a full session).
3. If the changes were committed, use `git reset --soft HEAD~1` then `git checkout -- .`.
4. Notify the user once the state is restored.
