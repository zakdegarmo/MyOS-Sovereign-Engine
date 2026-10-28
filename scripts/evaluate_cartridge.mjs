import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // Native support for environment variables

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve Environment Variables from Apps/Web
const ENV_PATH = path.resolve(__dirname, '../apps/web/.env.local');
if (fs.existsSync(ENV_PATH)) {
    dotenv.config({ path: ENV_PATH });
    console.log(`[Auditor] Environment loaded from ${ENV_PATH}`);
}

const PUBLIC_INTEGRATIONS_DIR = path.resolve(__dirname, '../apps/web/public/integrations/integrations');
const SRC_INTEGRATIONS_DIR = path.resolve(__dirname, '../apps/web/src/integrations');

// Default target for bulk audits, but evaluation logic will now check both
const INTEGRATIONS_DIR = SRC_INTEGRATIONS_DIR;
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY or VITE_GEMINI_API_KEY not found in .env.local.");
    process.exit(1);
}

const GEMINI_MODEL = "gemini-2.0-flash"; // Upgraded to stable 2.0 Flash
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * SUBSTRATE FALLBACK: If the cloud API is unavailable/unstable, 
 * we can pipe the request through our own local Mistral instance via Swarm.
 */
async function localSubstrateEvaluate(prompt) {
    console.log("[Auditor] 📡 Cloud API Latency/Error detected. Engaging Local Mistral Substrate...");
    try {
        const res = await fetch('http://localhost:3000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'mistral',
                prompt: prompt,
                system: "You are the Ontological Auditor. Return JSON ONLY."
            })
        });
        if (!res.ok) throw new Error("Local Substrate is silent.");
        const data = await res.json();
        const text = data.message ? data.message.content : (data.response || data.text);
        return text;
    } catch (e) {
        console.error("[Auditor] 💀 Total Intelligence Failure: Cloud and Local are both offline.");
        return null;
    }
}

const PILLARS = [
    "Self (⚹)", "Thought (☿)", "Logic (🜔)", "Unity (🝧)", "Existence (🜄)", 
    "Improvement (🜏)", "Mastery (☉)", "Resonance (♀)", "Transcendence (🜍)", "Omni (🜋)"
];

const PROMPT_TEMPLATE = `
Directive_Type: NLD_CARTRIDGE_IDENTIFICATION
Context: You are the Ontological Auditor for MyOS.
Task: Analyze the provided code/metadata for a software applet and assign it a permanent 10-depth genomic sequence within the Fractal Semantic Genome.

The 10 Pillars are:
${PILLARS.join(", ")}

Requirements:
1. Return a JSON object with a 'sequence' array containing exactly 10 symbols.
2. Layer 1 must be one of the symbols: ⚹, ☿, 🜔, 🝧, 🜄, 🜏, ☉, ♀, 🜍, 🜋.
3. Layers 2-10 should be the most semantically accurate sub-pillars chosen recursively.
4. Provide a 'rationale' explaining why this app belongs at this genomic coordinate.
5. Provide a 'suggested_name' and 'suggested_description' based on the analysis.

Applet Content To Analyze:
---
{{CONTENT}}
---

Response_Format: JSON ONLY.
`;

async function evaluateFolder(folderName) {
    let fullPath = path.join(SRC_INTEGRATIONS_DIR, folderName);
    
    // Check SRC first, then PUBLIC
    if (!fs.existsSync(fullPath)) {
        fullPath = path.join(PUBLIC_INTEGRATIONS_DIR, folderName);
        if (!fs.existsSync(fullPath)) {
            console.error(`[Auditor] Folder not found in SRC or PUBLIC: ${folderName}`);
            return null;
        }
    }

    const files = fs.readdirSync(fullPath);
    let analysisContent = `Folder Name: ${folderName}\n`;

    // Strategy: Read package.json, README, or index.html for context
    const priorityFiles = ['package.json', 'README.md', 'index.html', 'main.js', 'App.tsx'];
    for (const file of priorityFiles) {
        if (files.includes(file)) {
            const content = fs.readFileSync(path.join(fullPath, file), 'utf8');
            analysisContent += `--- File: ${file} ---\n${content.substring(0, 3000)}\n`;
        }
    }

    console.log(`[Auditor] Evaluating ${folderName}...`);

    const fullPrompt = PROMPT_TEMPLATE.replace('{{CONTENT}}', analysisContent);
    let rawText = "";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (response.ok) {
            const data = await response.json();
            rawText = data.candidates[0].content.parts[0].text;
        } else {
            console.warn(`[Auditor] Cloud API failure (${response.status}). Falling back...`);
            rawText = await localSubstrateEvaluate(fullPrompt);
        }
    } catch (err) {
        console.warn(`[Auditor] Cloud Fetch Error. Falling back...`);
        rawText = await localSubstrateEvaluate(fullPrompt);
    }

    if (!rawText) return null;

    try {
        // Robust JSON extraction in case the model wraps it in markdown backticks
        const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```|({[\s\S]*})/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[2]) : rawText;
        const result = JSON.parse(jsonString.trim());
        
        return {
            folder: folderName,
            ...result
        };
    } catch (err) {
        console.error(`[Auditor] Failed to parse intelligence for ${folderName}:`, err.message);
        console.log("Raw Response:", rawText.slice(0, 100));
        return null;
    }
}

async function runAudit() {
    // CLI Argument Support: If a folder is passed, audit only that folder.
    const targetFolder = process.argv[2];
    
    if (targetFolder) {
        console.log(`[Auditor] Targeted Audit Triggered: ${targetFolder}`);
        const result = await evaluateFolder(targetFolder);
        if (result) {
            // Merge with existing report
            const reportPath = path.resolve(__dirname, '../results/audit_report.json');
            let results = [];
            if (fs.existsSync(reportPath)) {
                try {
                    results = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                } catch (e) { results = []; }
            }
            
            // Remove existing entry for this folder if it exists
            results = results.filter(r => r.folder !== targetFolder);
            results.push(result);
            
            if (!fs.existsSync(path.dirname(reportPath))) fs.mkdirSync(path.dirname(reportPath), { recursive: true });
            fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
            console.log(`[Auditor] Targeted Report saved: ${targetFolder}`);
        }
        return;
    }

    const folders = fs.readdirSync(INTEGRATIONS_DIR).filter(f => 
        fs.statSync(path.join(INTEGRATIONS_DIR, f)).isDirectory() && !f.startsWith('.')
    );

    console.log(`[Auditor] Found ${folders.length} target folders in ${INTEGRATIONS_DIR}`);
    if (folders.length === 0) {
        console.error("[Auditor] No integration folders found! Check path logic.");
        return;
    }

    const results = [];
    // Just audit 10 for now to test the logic
    for (const folder of folders.slice(0, 10)) {
        const result = await evaluateFolder(folder);
        if (result) {
            results.push(result);
        } else {
            console.error(`[Auditor] Skipping ${folder} due to evaluation failure.`);
        }
    }

    console.log("\n--- ONTOLOGICAL AUDIT REPORT ---");
    results.forEach(r => {
        console.log(`[${r.folder}] -> ${r.sequence.join('.')} (${r.suggested_name})`);
        console.log(`Rationale: ${r.rationale}\n`);
    });

    // Save to results/audit_report.json
    const reportPath = path.resolve(__dirname, '../results/audit_report.json');
    if (!fs.existsSync(path.dirname(reportPath))) fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`Report saved to ${reportPath}`);
}

runAudit();
