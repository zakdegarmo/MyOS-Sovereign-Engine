## 2026-07-06T02:04:09Z
You are the Worker subagent for documentation.
Your working directory is: c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_dnd_implement_3
Your task is to write `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\LAUNCH_INSTRUCTIONS.md` at the project root.

The document must clearly explain how to run and test the AI-orchestrated D&D VTT platform cartridge:
1. Prerequisites:
   - Ensure Node.js (v18+) is installed.
   - Install local dependencies by running `npm install` in the project root.
   - (Optional but recommended) Ensure Ollama is installed and running (`ollama serve`), and the `gemma4:latest` model is pulled (`ollama pull gemma4:latest`).
2. Starting the Application:
   - Run `npm run dev` in the project root.
   - This starts the local server concurrently: Vite (web dashboard at `http://localhost:3000`), the agent bridge proxy on port 8081, and the other background services.
3. Accessing the VTT Cartridge:
   - Open a browser and go to `http://localhost:3000`.
   - Click the "Omni" node / tab (emerald `🜋` symbol) on the left vertical dock.
   - Navigate to the OmniLab console by selecting the "IsAspectOf (Omni)" factor or clicking the corresponding node.
   - In the "Cartridge Library" sidebar of the OmniLab window, select "AI-Orchestrated D&D VTT".
4. Playing and Testing:
   - Enable Audio by clicking the "Volume" icon in the cartridge header.
   - Click the hexagonal grid pillars to move your Player (blue capsule) figurine.
   - Type actions in the lower text console (e.g. "Attack the goblin with my longsword", "Cast a lightning bolt", or "Drink a healing potion") and click Send.
   - Observe the narrative response returned by Ollama (or the simulated fallback DM if Ollama is offline) and see state/HP changes reflected dynamically on the dashboard.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

When finished, write your handoff report to `c:\Users\zakde\Desktop\AntiGravity projects\MyOS\.agents\worker_dnd_implement_3\handoff.md` and send a message to parent (conversation ID: 0acd0252-fd7a-4005-bfaf-2105cac257e7).
