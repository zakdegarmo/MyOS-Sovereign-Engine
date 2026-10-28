# Launch Instructions: AI-Orchestrated D&D VTT Platform Cartridge

This document provides instructions on how to set up, run, and test the AI-orchestrated D&D Virtual Tabletop (VTT) platform cartridge.

## 1. Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js**: Ensure Node.js (v18+) is installed on your system.
- **Local Dependencies**: Install the project's dependencies by opening your terminal in the project root directory and running:
  ```bash
  npm install
  ```
- **Ollama (Optional but recommended)**: 
  - Ensure [Ollama](https://ollama.com) is installed and running:
    ```bash
    ollama serve
    ```
  - Pull the `gemma4:latest` model:
    ```bash
    ollama pull gemma4:latest
    ```

---

## 2. Starting the Application

To start all necessary services for the VTT platform, run the following command in the project root directory:

```bash
npm run dev
```

This starts the local servers concurrently:
- **Vite Web Dashboard**: Hosted at [http://localhost:3000](http://localhost:3000).
- **Agent Bridge Proxy**: Running on port `8081`.
- **Other Background Services**: Includes required background and agent servers.

---

## 3. Accessing the VTT Cartridge

Once the servers are running, follow these steps to open the D&D VTT cartridge:

1. Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).
2. Click the **Omni** node / tab (represented by the emerald `🜋` symbol) on the left vertical dock.
3. Navigate to the **OmniLab** console by selecting the **IsAspectOf (Omni)** factor or clicking the corresponding node.
4. In the **Cartridge Library** sidebar of the OmniLab window, select **"AI-Orchestrated D&D VTT"**.

---

## 4. Playing and Testing

To interact with the cartridge and test its features:

- **Enable Audio**: Click the **Volume** icon in the cartridge header to turn sound on.
- **Move the Player**: Click the hexagonal grid pillars to move your Player (represented by a blue capsule) figurine.
- **Send Actions**: Type your actions in the lower text console (e.g., `"Attack the goblin with my longsword"`, `"Cast a lightning bolt"`, or `"Drink a healing potion"`) and click **Send**.
- **Observe Responses**: Check the narrative response returned by the DM. If Ollama is running, it will generate dynamic narrative responses; if offline, the simulated fallback DM will respond. Watch state and HP changes update dynamically on the dashboard.
