import http from 'http';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PORT = 3000;
const bus = new EventEmitter();

// In-Memory Telemetry & Chat State
let telemetryState = {
    agents: {},
    system: { cpu: 0, fps: 60, status: 'calibrated' },
    timestamp: Date.now()
};
let chatHistory = []; // [ { role: 'user'|'assistant', content: '...' }, ... ]
const MAX_HISTORY = 100; // Increased for deeper context

const server = http.createServer((req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // --- DASHBOARD (ROOT) ---
    if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>MyOS Swarm Telemetry Hub</title>
                <style>
                    body { background: #0a0a0c; color: #00f2ff; font-family: 'Courier New', monospace; padding: 20px; line-height: 1.6; }
                    .dashboard { border: 1px solid #00f2ff; padding: 20px; border-radius: 8px; box-shadow: 0 0 15px rgba(0, 242, 255, 0.2); max-width: 900px; margin: 0 auto; }
                    .header { font-size: 1.5em; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; border-bottom: 1px solid #00f2ff; padding-bottom: 10px; }
                    .live { color: #f0f; animation: blink 1s infinite; }
                    pre { background: #111; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 0.9em; border: 1px solid #222; }
                    .chat-section { margin-top: 30px; border-top: 1px dashed #00f2ff; pt: 20px; }
                    input { background: #000; color: #00f2ff; border: 1px solid #00f2ff; padding: 10px; width: 80%; font-family: inherit; }
                    button { background: #00f2ff; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; }
                    #chat-output { margin-top: 10px; white-space: pre-wrap; color: #fff; border-left: 3px solid #f0f; padding-left: 10px; }
                    @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
                </style>
            </head>
            <body>
                <div class="dashboard">
                    <div class="header">🌀 Swarm Status: <span class="live">ACTIVE</span></div>
                    
                    <h3>📡 Real-time Telemetry</h3>
                    <pre id="state">Loading data...</pre>
                    <div class="chat-section">
                        <h3>🌉 Inter-Agent Bridge (Mistral)</h3>
                        <p>Talk to the local Mistral model via /chat proxy (Omni-Session):</p>
                        <div id="chat-history" style="max-height: 400px; overflow-y: auto; background: #000; padding: 10px; margin-bottom: 15px; border: 1px solid #333; font-size: 0.85em;"></div>
                        <input type="text" id="chat-input" placeholder="Type a message to Mistral..." onkeypress="if(event.key==='Enter') sendMessage()">
                        <button onclick="sendMessage()">SEND</button>
                        <button onclick="clearHistory()" style="background: #333; color: #fff; margin-left: 10px;">CLEAR</button>
                        <div id="chat-output" style="display:none"></div>
                    </div>
                </div>

                <script>
                    async function updateState() {
                        try {
                            const res = await fetch('/state');
                            const data = await res.json();
                            document.getElementById('state').innerText = JSON.stringify(data, null, 2);
                        } catch(e) {}
                    }

                    async function updateHistory() {
                        try {
                            const res = await fetch('/history');
                            const history = await res.json();
                            const container = document.getElementById('chat-history');
                            container.innerHTML = history.map(m => {
                                const color = m.role === 'user' ? '#00f2ff' : '#f0f';
                                return '<div style="margin-bottom:10px; border-left:2px solid ' + color + '; padding-left:8px;">' +
                                       '<b style="color:' + color + '">' + m.role.toUpperCase() + ':</b>' +
                                       '<div style="color:#ccc; margin-top:4px;">' + m.content + '</div>' +
                                       '</div>';
                            }).join('');
                            container.scrollTop = container.scrollHeight;
                        } catch(e) {}
                    }

                    async function clearHistory() {
                        await fetch('/clear', { method: 'POST' });
                        updateHistory();
                    }

                    async function sendMessage() {
                        const input = document.getElementById('chat-input');
                        const text = input.value.trim();
                        if(!text) return;

                        // Add optimistic user message
                        const historyContainer = document.getElementById('chat-history');
                        historyContainer.innerHTML += '<div style="margin-bottom: 10px; border-left: 2px solid #00f2ff; padding-left: 8px;">' +
                            '<b style="color: #00f2ff">USER:</b>' +
                            '<div style="color: #ccc; margin-top: 4px;">' + text + '</div>' +
                            '</div>';
                        historyContainer.scrollTop = historyContainer.scrollHeight;
                        input.value = "";

                        try {
                            const res = await fetch('/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    model: 'mistral',
                                    messages: [{ role: 'user', content: text }],
                                    stream: false
                                })
                            });
                            updateHistory();
                        } catch(e) {
                            console.error("Chat Error:", e);
                        }
                    }

                    setInterval(updateState, 2000);
                    setInterval(updateHistory, 3000); // Polling for agentically generated messages
                    updateState();
                    updateHistory();
                </script>
            </body>
            </html>
        `);
        return;
    }

    // --- STATE API (GET) ---
    if (req.method === 'GET' && req.url === '/state') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(telemetryState));
        return;
    }

    // --- SSE STREAM ---
    if (req.method === 'GET' && req.url === '/sse') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const onTelemetry = (data) => {
            res.write(`event: telemetry\ndata: ${JSON.stringify(data)}\n\n`);
        };

        bus.on('telemetry', onTelemetry);

        req.on('close', () => {
            bus.removeListener('telemetry', onTelemetry);
        });
        return;
    }

    // --- TELEMETRY INGRESS (POST) ---
    if (req.method === 'POST' && req.url === '/telemetry') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                // Update Local State
                if (data.agent) {
                    telemetryState.agents[data.agent] = {
                        ...telemetryState.agents[data.agent],
                        ...data,
                        lastSeen: Date.now()
                    };
                } else if (data.system) {
                    telemetryState.system = { ...telemetryState.system, ...data.system };
                }
                telemetryState.timestamp = Date.now();
                
                // Broadcast to SSE
                bus.emit('telemetry', telemetryState);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400);
                res.end();
            }
        });
        return;
    }

    // --- AUDIT API (POST) ---
    if (req.method === 'POST' && req.url === '/audit') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                if (!body) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Empty body' }));
                }

                const { path: folderPath } = JSON.parse(body);
                if (!folderPath) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Missing path' }));
                }

                // Execute the evaluate_cartridge.mjs script
                const scriptPath = path.resolve(process.cwd(), '../../scripts/evaluate_cartridge.mjs');
                
                // Escape path for shell (simple escaping for windows/posix)
                const escapedPath = folderPath.replace(/"/g, '\\"');
                console.log(`[Swarm Audit] Evaluating: "${escapedPath}"`);
                
                exec(`node ${scriptPath} "${escapedPath}"`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`[Audit Error] ${error.message}`);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: error.message, stderr, stdout }));
                    }
                    
                    try {
                        const reportPath = path.resolve(process.cwd(), '../../results/audit_report.json');
                        if (!fs.existsSync(reportPath)) {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ error: 'Audit report file not found', stdout }));
                        }

                        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                        
                        // Robust matching: check for folder name, or 'App' suffix, or quoted string
                        const normalizedTarget = folderPath.toLowerCase().trim();
                        const result = report.find(r => {
                            const normalizedReport = r.folder.toLowerCase().trim();
                            return normalizedReport === normalizedTarget || 
                                   normalizedReport === `'${normalizedTarget}' app` ||
                                   normalizedReport.includes(normalizedTarget) ||
                                   normalizedTarget.includes(normalizedReport);
                        });
                        
                        if (result) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result));
                        } else {
                            console.warn(`[Audit Warning] Match not found for: ${folderPath}`);
                            res.writeHead(404, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Audit result not found in report', stdout, folderPath }));
                        }
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Failed to read audit report', details: e.message, stdout }));
                    }
                });
            } catch (e) {
                console.error("[Swarm Audit] Ingress Error:", e);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON Ingress', details: e.message }));
            }
        });
        return;
    }

    // --- MESSAGES / JSON-RPC ---
    if (req.method === 'POST' && req.url === '/messages') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incoming = JSON.parse(body);
                console.log('[Swarm Hub] Incoming Message:', incoming);
                
                // Track inter-agent dialogue in history
                if (incoming.chat || incoming.content) {
                    const msg = {
                        role: incoming.role || 'user',
                        agent: incoming.agent || 'unknown',
                        content: incoming.chat || incoming.content,
                        timestamp: Date.now()
                    };
                    chatHistory.push(msg);
                    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ jsonrpc: "2.0", result: "ACK", id: incoming.id || null }));
            } catch (e) {
                res.writeHead(400);
                res.end();
            }
        });
        return;
    }

    // --- CHAT PROXY (Mistral via Ollama) ---
    if (req.method === 'POST' && req.url === '/chat') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const incoming = JSON.parse(body);
                // Extract message or system context
                const userMessage = incoming.messages 
                    ? incoming.messages[incoming.messages.length - 1] 
                    : { role: 'user', content: incoming.prompt || incoming.chat };
                
                // 1. Add to Managed History if not already there
                const lastInHistory = chatHistory[chatHistory.length - 1];
                if (!lastInHistory || lastInHistory.content !== userMessage.content) {
                    chatHistory.push({ ...userMessage, agent: incoming.agent || 'user' });
                    if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
                }

                // 2. Prepare Payload for Ollama
                const messagesForOllama = [];
                if (incoming.system) {
                    messagesForOllama.push({ role: 'system', content: incoming.system });
                }
                
                // Map history to Ollama format (role, content)
                messagesForOllama.push(...chatHistory.map(m => ({ role: m.role || 'user', content: m.content || "" })));

                const proxyReq = http.request({
                    hostname: 'localhost',
                    port: 11434,
                    path: '/api/chat',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, (proxyRes) => {
                    let responseBody = '';
                    proxyRes.on('data', chunk => responseBody += chunk.toString());
                    proxyRes.on('end', () => {
                        try {
                            const data = JSON.parse(responseBody);
                            if (data.message) {
                                chatHistory.push({ ...data.message, agent: incoming.agent || 'mistral' });
                                if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
                            }
                            res.writeHead(proxyRes.statusCode, proxyRes.headers);
                            res.end(responseBody);
                        } catch (e) {
                            res.writeHead(500);
                            res.end(JSON.stringify({ error: 'LLM Response Parse Failed' }));
                        }
                    });
                });

                proxyReq.on('error', (e) => {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Ollama Connection Failed', details: e.message }));
                });

                proxyReq.write(JSON.stringify({
                    model: incoming.model || 'mistral',
                    messages: messagesForOllama,
                    stream: false
                }));
                proxyReq.end();
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON Ingress' }));
            }
        });
        return;
    }

    // --- GROUNDED CHAT API (POST) ---
    // Uses Gemini for grounding/search, then feeds to local Mistral
    if (req.method === 'POST' && req.url === '/grounded-chat') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const incoming = JSON.parse(body);
                const userMessage = incoming.prompt || incoming.chat || (incoming.messages && incoming.messages[incoming.messages.length - 1].content);
                
                console.log(`[Swarm Grounding] Grounding request: "${userMessage?.slice(0, 50)}..."`);

                // 1. Perform Google Search / Grounding via Gemini API
                // Using the search tool capability of Gemini
                const googleSearchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Perform a search to find factual information relevant to this user query: "${userMessage}". provide a concise factual summary.` }] }],
                        tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "DYNAMIC", dynamic_threshold: 0.1 } } }]
                    })
                });

                const searchData = await googleSearchResponse.json();
                const researchSummary = searchData?.candidates?.[0]?.content?.parts?.[0]?.text || "No specific web data found.";
                
                console.log(`[Swarm Grounding] Research Summary obtained.`);

                // 2. Feed Research into local Mistral context
                const systemContext = incoming.system || "You are Einstein (The Tutor).";
                const augmentedSystem = `${systemContext}\n\n[RESEARCH_GROUNDING]: ${researchSummary}\n\nUse the above research to ensure your response is factually accurate to the current real world.`;

                // 3. Proxy to Ollama
                const messagesForOllama = chatHistory.map(m => ({ role: m.role || 'user', content: m.content || "" }));
                messagesForOllama.push({ role: 'user', content: userMessage });

                const proxyReq = http.request({
                    hostname: 'localhost',
                    port: 11434,
                    path: '/api/chat',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, (proxyRes) => {
                    let responseBody = '';
                    proxyRes.on('data', chunk => responseBody += chunk.toString());
                    proxyRes.on('end', () => {
                        const data = JSON.parse(responseBody);
                        if (data.message) {
                            chatHistory.push({ role: 'user', content: userMessage, agent: incoming.agent || 'user' });
                            chatHistory.push({ ...data.message, agent: incoming.agent || 'mistral' });
                            if (chatHistory.length > MAX_HISTORY) chatHistory.shift();
                        }
                        res.writeHead(proxyRes.statusCode, proxyRes.headers);
                        res.end(responseBody);
                    });
                });

                proxyReq.on('error', (e) => {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Ollama Connection Failed', details: e.message }));
                });

                proxyReq.write(JSON.stringify({
                    model: incoming.model || 'mistral',
                    messages: [
                        { role: 'system', content: augmentedSystem },
                        ...messagesForOllama
                    ],
                    stream: false
                }));
                proxyReq.end();

            } catch (e) {
                console.error("[Swarm Grounding] Error:", e);
                res.writeHead(500);
                res.end(JSON.stringify({ error: 'Grounding Process Failed', details: e.message }));
            }
        });
        return;
    }

    // --- HISTORY API (GET) ---
    if (req.method === 'GET' && req.url === '/history') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(chatHistory));
        return;
    }
    
    // --- TOOLS API (POST) ---
    // PROXY TO AGENT BRIDGE (8081)
    if (req.method === 'POST' && req.url === '/tools') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { tool, args } = JSON.parse(body);
                console.log(`[Swarm Hub] Proxying tool call to Bridge: ${tool}`, args);

                // Map tool names to Bridge endpoints
                let endpoint = '';
                let payload = { ...args };

                if (tool === 'read_file') endpoint = 'fs/read';
                else if (tool === 'write_file') endpoint = 'fs/write';
                else if (tool === 'exec_cmd' || tool === 'exec') endpoint = 'exec';
                else if (tool === 'list_directory') {
                    // List directory is handled locally or via exec if bridge doesn't have it
                    // For now, we'll keep the local list_directory but add N: drive support
                    const dirPath = args.path || '.';
                    const files = fs.readdirSync(dirPath, { withFileTypes: true });
                    const result = files.map(f => ({ name: f.name, type: f.isDirectory() ? 'directory' : 'file' }));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ content: [{ text: JSON.stringify(result) }] }));
                }
                else {
                    res.writeHead(404);
                    return res.end(JSON.stringify({ error: 'Tool not found' }));
                }

                // Proxy the request to the Agent Bridge
                const bridgeReq = http.request({
                    hostname: 'localhost',
                    port: 8081,
                    path: `/api/${endpoint}`,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }, (bridgeRes) => {
                    let bridgeBody = '';
                    bridgeRes.on('data', chunk => bridgeBody += chunk.toString());
                    bridgeRes.on('end', () => {
                        res.writeHead(bridgeRes.statusCode, bridgeRes.headers);
                        res.end(bridgeBody);
                    });
                });

                bridgeReq.on('error', (e) => {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: 'Bridge Connection Failed', details: e.message }));
                });

                bridgeReq.write(JSON.stringify(payload));
                bridgeReq.end();

            } catch (e) {
                console.error("[Swarm Tool Proxy] Error:", e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // --- LORE PERSISTENCE BRIDGE (POST) ---
    if (req.method === 'POST' && req.url === '/api/save-lore-index') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const outputPath = path.join(process.cwd(), 'public/data/lore_index.json');
                
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`[Swarm Lore] Index successfully persisted to: ${outputPath}`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: outputPath }));
            } catch (e) {
                console.error("[Swarm Lore] Persistence Error:", e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, () => {
    console.log(`🌀 Swarm Telemetry Hub running on http://localhost:${PORT}`);
    console.log(`   > SSE Endpoint: http://localhost:${PORT}/sse`);
    console.log(`   > Dashboard:    http://localhost:${PORT}/`);
});
