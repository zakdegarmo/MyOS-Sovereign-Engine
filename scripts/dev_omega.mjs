import concurrently from 'concurrently';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');

// Sibling Detection
const PARENT_DIR = path.resolve(ROOT_DIR, '..');
const NEXUS_MCP_PATH = path.join(PARENT_DIR, 'nexus-context-server');
const STORAGE_SERVER_PATH = path.join(PARENT_DIR, 'the-mystra-nexus');

function checkPaths() {
    console.log("🔍 Checking Harmony ecosystem paths...");
    const required = [
        { path: NEXUS_MCP_PATH, name: 'Nexus MCP' },
        { path: STORAGE_SERVER_PATH, name: 'Mystra Storage Server' },
    ];
    for (const req of required) {
        if (!fs.existsSync(req.path)) {
            console.error(`❌ FATAL: ${req.name} not found at ${req.path}`);
            process.exit(1);
        } else {
            console.log(`✅ ${req.name} verified.`);
        }
    }
}

async function main() {
    checkPaths();

    console.log("🌀 Initializing MyOS Dev-Omega (v6-STABLE)...");

    const commands = [
        {
            command: 'ollama serve',
            name: 'LLM-ENGINE',
            prefixColor: 'cyan',
        },
        {
            command: 'node server.js',
            name: 'STORAGE-DB',
            prefixColor: 'white',
            cwd: STORAGE_SERVER_PATH
        },
        {
            command: `npx tsx index.ts`,
            name: 'NEXUS-MCP',
            prefixColor: 'green',
            cwd: NEXUS_MCP_PATH
        },
        {
            command: 'npm run dev --workspace=apps/web',
            name: 'FRONTEND-APP',
            prefixColor: 'blue',
            cwd: ROOT_DIR
        }
    ];

    const { result } = concurrently(commands, {
        prefix: 'name',
        killOthers: ['failure', 'success'],
        restartDelay: 5000,
        restartTries: 3
    });

    result.then(
        () => console.log("All services terminated successfully."),
        (err) => console.error("One or more services failed during Stability trial:", err)
    );
}

main();
