---
name: /forgeTool
description: "Triggers the local Sovereign Forge. Sends a tool description to the local LLM (gemma4) to autonomously write and save a new tool script."
---

# 🛠️ /forgeTool

You are executing the `/forgeTool` skill. This skill is invoked when you, a subagent, or the user realizes that the current toolkit lacks the capability to complete a task. 

## Workflow

1. Use the `run_command` tool to execute the local forge script, passing the exact tool description as the argument:
   `python C:\Users\zakde\.gemini\config\skills\forge_tool\scripts\local_forge.py "Description of the tool needed"`

2. Wait for the command to finish. The script will ping `localhost:11434` (gemma4), ask it to write the Python code, and automatically save the code and generate the new `SKILL.md` file.

3. The script will print the name and path of the newly forged tool to the terminal. Report this success back to the user or subagent!
