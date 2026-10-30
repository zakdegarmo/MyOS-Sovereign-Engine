import http from 'http';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec, execFile, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { create, insert, search } from '@orama/orama';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Jail the agent to the MyOS project root (one level up from apps/web)
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const WORKSPACE_ROOT = PROJECT_ROOT;
// Path to the Antigravity Knowledge Base
const KNOWLEDGE_DIR = path.resolve('C:/Users/zakde/.gemini/antigravity/knowledge');

const PORT = 8081;

// Config and Env variables for dual routing
const CONFIG_PATH = path.resolve(__dirname, 'bridge_config.json');
let bridgeConfig = { useCloud: false, activeModel: 'myos-cortex:latest' };
let geminiApiKey = '';

// Zero-API Gemini Web DOM Synaptic Bridge Queue
let geminiDomQueue = [];
let geminiDomResolvers = new Map();

async function loadEnv() {
    try {
        const envPath = path.resolve(PROJECT_ROOT, '.env.local');
        const envContent = await fs.readFile(envPath, 'utf-8');
        const match = envContent.match(/GEMINI_API_KEY\s*=\s*(.*)/);
        if (match && match[1]) {
            geminiApiKey = match[1].trim();
            console.log('[Agent Bridge] Loaded GEMINI_API_KEY from .env.local');
        }
    } catch (e) {
        console.log('[Agent Bridge] Failed to load .env.local:', e.message);
    }
}

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_PATH, 'utf-8');
        bridgeConfig = JSON.parse(data);
        console.log('[Agent Bridge] Loaded config:', bridgeConfig);
    } catch (e) {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(bridgeConfig, null, 2), 'utf-8');
        console.log('[Agent Bridge] Created default bridge_config.json');
    }
}

function geminiToOllama(geminiBody, localModel) {
    const messages = [];
    if (geminiBody.systemInstruction && geminiBody.systemInstruction.parts) {
        const sysText = geminiBody.systemInstruction.parts.map(p => p.text).join('\n');
        messages.push({ role: 'system', content: sysText });
    }
    if (geminiBody.contents) {
        for (const content of geminiBody.contents) {
            const role = content.role === 'model' ? 'assistant' : 'user';
            const partsText = content.parts.map(p => p.text || '').join('\n');
            const images = [];
            for (const part of content.parts) {
                if (part.inlineData && part.inlineData.mimeType && part.inlineData.data) {
                    images.push(part.inlineData.data);
                }
            }
            const msg = { role, content: partsText };
            if (images.length > 0) msg.images = images;
            messages.push(msg);
        }
    }
    return {
        model: localModel,
        messages,
        stream: false,
        options: {
            temperature: geminiBody.generationConfig?.temperature ?? 0.7
        }
    };
}

function ollamaToGemini(ollamaText) {
    return {
        candidates: [
            {
                content: {
                    parts: [{ text: ollamaText }],
                    role: 'model'
                },
                finishReason: 'STOP'
            }
        ]
    };
}


// Initialize Orama DBs separately to prevent semantic context pollution
let systemDb = null;
let loreDb = null;

async function initOrama() {
    try {
        systemDb = await create({
            schema: {
                id: 'string',
                title: 'string',
                content: 'string',
                path: 'string'
            }
        });

        loreDb = await create({
            schema: {
                id: 'string',
                title: 'string',
                content: 'string',
                path: 'string'
            }
        });
        
        logToBridge('[Agent Bridge] Indexing Knowledge Base into System DB...');
        
        // Recursive function to read all .md files
        async function scanDir(dir) {
            let results = [];
            try {
                const list = await fs.readdir(dir);
                for (let file of list) {
                    file = path.resolve(dir, file);
                    const stat = await fs.stat(file);
                    if (stat && stat.isDirectory()) {
                        results = results.concat(await scanDir(file));
                    } else if (file.endsWith('.md')) {
                        results.push(file);
                    }
                }
            } catch (e) {
                // Ignore if dir doesn't exist
            }
            return results;
        }

        const files = await scanDir(KNOWLEDGE_DIR);
        let count = 0;
        for (const file of files) {
            const content = await fs.readFile(file, 'utf-8');
            const title = path.basename(file, '.md');
            await insert(systemDb, {
                id: file,
                title: title,
                content: content,
                path: file
            });
            count++;
        }
        logToBridge(`[Agent Bridge] System DB Indexing Complete. ${count} Knowledge Items loaded.`);



        // Load Topology DB (Maps)
        const topoDbPath = path.resolve(__dirname, 'public/data/topology-db');
        try {
            await fs.mkdir(topoDbPath, { recursive: true });
            const topoFiles = await fs.readdir(topoDbPath);
            let totalTopoChunks = 0;
            for (const file of topoFiles) {
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(topoDbPath, file), 'utf-8');
                    const topoData = JSON.parse(content);
                    await insert(loreDb, {
                        id: topoData.id,
                        title: `Topology Map: ${topoData.title}`,
                        content: JSON.stringify(topoData.data),
                        path: topoData.source
                    });
                    totalTopoChunks++;
                }
            }
            logToBridge(`[Agent Bridge] Topology DB Loaded: ${totalTopoChunks} maps recovered.`);
        } catch (e) {
            console.log('[Agent Bridge] Failed to load topology-db: ', e.message);
        }

    } catch (error) {
        console.error('[Agent Bridge Error] Failed to initialize Orama:', error);
    }
}

function isPathInside(parentPath, childPath) {
    const prefixLower = path.resolve(parentPath).toLowerCase();
    const resolvedLower = path.resolve(childPath).toLowerCase();
    if (resolvedLower === prefixLower) return true;
    return resolvedLower.startsWith(prefixLower + path.sep);
}

// Helper to ensure path is within jail or on the trusted local directories
function isSafePath(targetPath) {
    const resolved = path.isAbsolute(targetPath) 
        ? path.resolve(targetPath) 
        : path.resolve(PROJECT_ROOT, targetPath);
        
    const lowerResolved = resolved.toLowerCase();
    
    const isInsideProject = isPathInside(PROJECT_ROOT, resolved);
    const isOnNDrive = lowerResolved.startsWith('n:');
    const isOnEDrive = lowerResolved.startsWith('e:');
    const isGeminiDir = isPathInside('c:\\users\\zakde\\.gemini', resolved);
    const isDownloadsDir = isPathInside('c:\\users\\zakde\\downloads', resolved);
    const isDesktopDir = isPathInside('c:\\users\\zakde\\desktop', resolved);
    
    return isInsideProject || isOnNDrive || isOnEDrive || isGeminiDir || isDownloadsDir || isDesktopDir;
}

async function scanSector(dir) {
    let results = [];
    const black_holes = [
        'node_modules', '.venv', '.git', '__pycache__', 'dist', 'build', 
        'lore-db', 'topology-db', '.next', '.yarn', 'coverage', 'tmp', 'temp', 'public'
    ];
    try {
        const list = await fs.readdir(dir);
        for (let file of list) {
            if (black_holes.includes(file)) continue;
            const fullPath = path.resolve(dir, file);
            const stat = await fs.lstat(fullPath);
            if (stat && stat.isSymbolicLink()) continue;
            if (stat && stat.isDirectory()) {
                results = results.concat(await scanSector(fullPath));
            } else {
                const ext = path.extname(file);
                const valid_exts = ['.txt', '.py', '.md', '.json', '.js', '.ts', '.tsx'];
                if (valid_exts.includes(ext)) {
                    results.push(fullPath);
                }
            }
        }
    } catch (e) {
        console.error('[Agent Bridge RAG Scan Error]', e);
    }
    return results;
}

let logClients = [];
function logToBridge(msg) {
    console.log(msg);
    const eventData = `data: ${JSON.stringify({ timestamp: Date.now(), msg })}\n\n`;
    logClients.forEach(c => {
        try {
            c.write(eventData);
        } catch (e) {
            logClients = logClients.filter(client => client !== c);
        }
    });
}

const server = http.createServer(async (req, res) => {
    // Basic CORS for local development
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        return res.end();
    }

    // Remote Peer Telemetry (Cloudflare Edge & LAN Ingress)
    const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const clientCountry = req.headers['cf-ipcountry'] || 'LOCAL';
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const isCloudflare = !!req.headers['cf-ray'];

    if (isCloudflare && !global.__loggedPeers?.has(clientIp)) {
        if (!global.__loggedPeers) global.__loggedPeers = new Set();
        global.__loggedPeers.add(clientIp);
        console.log(`[MyNet Telemetry] 🌐 External Peer Connected: IP=${clientIp} | Country=${clientCountry} | UA=${userAgent.slice(0, 80)}`);
    }

    if (req.method === 'GET') {
        const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        if (parsedUrl.pathname === '/api/gemini-dom/poll') {
            const nextItem = geminiDomQueue.shift();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(nextItem || null));
        }

        if (parsedUrl.pathname === '/api/logs/stream') {
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*'
            });
            res.write(`data: ${JSON.stringify({ timestamp: Date.now(), msg: '[Agent Bridge] SSE Logs Linked.' })}\n\n`);
            logClients.push(res);
            req.on('close', () => {
                logClients = logClients.filter(c => c !== res);
            });
            return;
        }

        if (parsedUrl.pathname === '/api/desktop/files') {
            const queryPath = parsedUrl.searchParams.get('path');
            
            // Clean the path to prevent injection. For Windows paths, we should be careful with quotes.
            const safeQueryPath = queryPath ? queryPath.replace(/'/g, "''") : '';
            const cacheKey = safeQueryPath || '__default__';
            
            if (global.__desktopFilesCache && global.__desktopFilesCache.has(cacheKey)) {
                const entry = global.__desktopFilesCache.get(cacheKey);
                if (Date.now() - entry.timestamp < 15000) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(entry.data));
                }
            }
            
            const psCommand = `
                $targetPath = '${safeQueryPath}'
                if ([string]::IsNullOrWhiteSpace($targetPath)) {
                    $targetPath = 'C:\\Users\\zakde\\Desktop'
                    if (-not (Test-Path $targetPath)) {
                        $targetPath = [System.Environment]::GetFolderPath('Desktop')
                    }
                }
                
                $wsh = New-Object -ComObject WScript.Shell
                $files = Get-ChildItem -Path $targetPath -ErrorAction SilentlyContinue
                $results = foreach ($file in $files) {
                    $isLnk = $file.Extension -eq '.lnk'
                    $isUrl = $file.Extension -eq '.url'
                    $isShortcut = [bool]($isLnk -or $isUrl)
                    $target = $null
                    if ($isLnk -or $isUrl) {
                        try {
                            $shortcut = $wsh.CreateShortcut($file.FullName)
                            $target = $shortcut.TargetPath
                        } catch {}
                    }
                    [PSCustomObject]@{
                        name = $file.Name
                        path = $file.FullName
                        isShortcut = $isShortcut
                        isDirectory = [bool]$file.PSIsContainer
                        target = $target
                        size = $file.Length
                        extension = $file.Extension
                    }
                }
                if ($results) {
                    ConvertTo-Json -InputObject @($results) -Compress
                } else {
                    '[]'
                }
            `;

            execFile('powershell.exe', ['-NoProfile', '-Command', psCommand], { timeout: 15000 }, (error, stdout, stderr) => {
                if (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: error.message, stderr }));
                }
                try {
                    const parsed = JSON.parse(stdout.trim() || '[]');
                    const filesArray = Array.isArray(parsed) ? parsed : [parsed];
                    if (!global.__desktopFilesCache) global.__desktopFilesCache = new Map();
                    global.__desktopFilesCache.set(cacheKey, { data: filesArray, timestamp: Date.now() });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(filesArray));
                } catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Failed to parse PowerShell output', stdout }));
                }
            });
            return;
        }

        if (parsedUrl.pathname === '/api/desktop/file-content') {
            const queryPath = parsedUrl.searchParams.get('path');
            if (!queryPath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Missing path parameter' }));
            }
            
            try {
                const stat = await fs.stat(queryPath);
                if (!stat.isFile()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ error: 'Not a file' }));
                }

                const fileBuffer = await fs.readFile(queryPath);
                const ext = path.extname(queryPath).toLowerCase();
                let contentType = 'application/octet-stream';
                if (ext === '.glb') contentType = 'model/gltf-binary';
                else if (ext === '.gltf') contentType = 'model/gltf+json';
                else if (ext === '.png') contentType = 'image/png';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                else if (ext === '.txt') contentType = 'text/plain';

                res.writeHead(200, { 'Content-Type': contentType });
                return res.end(fileBuffer);
            } catch (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'File not found or unreadable', details: err.message }));
            }
        }
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = body ? JSON.parse(body) : {};
                const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
                const pathname = parsedUrl.pathname;

                // Endpoint: /api/win/launch
                if (pathname === '/api/gemini-dom/fulfill') {
                    const { id, response, error } = data;
                    if (id && geminiDomResolvers.has(id)) {
                        const resolver = geminiDomResolvers.get(id);
                        geminiDomResolvers.delete(id);
                        resolver({ response, error });
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'ok' }));
                }

                if (pathname === '/api/gemini-dom/ask') {
                    const { prompt, timeoutMs = 60000 } = data;
                    if (!prompt) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Prompt is required' }));
                    }
                    const reqId = 'dom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                    geminiDomQueue.push({ id: reqId, prompt });
                    
                    const responsePromise = new Promise((resolve) => {
                        const timer = setTimeout(() => {
                            geminiDomResolvers.delete(reqId);
                            geminiDomQueue = geminiDomQueue.filter(item => item.id !== reqId);
                            resolve({ error: 'Timeout waiting for Gemini Web DOM response (60s)' });
                        }, timeoutMs);

                        geminiDomResolvers.set(reqId, (result) => {
                            clearTimeout(timer);
                            resolve(result);
                        });
                    });

                    const result = await responsePromise;
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify(result));
                }

                if (pathname === '/api/win/launch') {
                    const { target } = data;
                    if (!target || typeof target !== 'string') {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: 'Missing or invalid target' }));
                    }

                    console.log(`[Agent Bridge] Launch request received for: ${target}`);
                    try {
                        const isHttpUrl = /^https?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=]+$/i.test(target);
                        let child;
                        if (isHttpUrl) {
                            child = spawn('cmd.exe', ['/c', 'start', '""', target], {
                                detached: true,
                                stdio: 'ignore',
                                windowsHide: true
                            });
                        } else {
                            const escapedTarget = target.replace(/'/g, "''");

                            // Native Windows Security Confirmation Popup (WScript.Shell with 15-second timeout)
                            const popupScript = `
                                $ws = New-Object -ComObject WScript.Shell
                                $res = $ws.Popup('An agent is requesting to launch: ' + '${escapedTarget}' + "\`n\`nDo you want to allow this?", 15, "Security Confirmation", 36)
                                if ($res -eq 6) { exit 0 } else { exit 1 }
                            `;

                            execFile('powershell.exe', ['-NoProfile', '-Command', popupScript], (popupErr) => {
                                if (popupErr) {
                                    console.log(`[Agent Bridge] Launch canceled or denied by user: ${target}`);
                                    return;
                                }
                                console.log(`[Agent Bridge] Launch authorized by user. Spawning: ${target}`);
                                const psCmd = `$psi = New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName = '${escapedTarget}'; $psi.UseShellExecute = $true; [System.Diagnostics.Process]::Start($psi);`;
                                execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], (launchErr, stdout, stderr) => {
                                    if (launchErr) {
                                        console.error('[Agent Bridge Launch Exec Error]', launchErr.message, stderr);
                                    } else {
                                        console.log('[Agent Bridge Launch Exec Success]', stdout.trim());
                                    }
                                });
                            });
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, launched: target }));
                    } catch (launchErr) {
                        console.error('[Agent Bridge Launch Error]', launchErr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: launchErr.message }));
                    }
                }

                // Endpoint: /api/settings/config
                if (pathname === '/api/settings/config') {
                    if (data.action === 'set' && data.config) {
                        bridgeConfig = { ...bridgeConfig, ...data.config };
                        await fs.writeFile(CONFIG_PATH, JSON.stringify(bridgeConfig, null, 2), 'utf-8');
                        console.log('[Agent Bridge] Updated config:', bridgeConfig);
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ config: bridgeConfig }));
                }

                // Endpoint: /api/rag/ingest
                if (pathname === '/api/rag/ingest') {
                    if (!data.path || !isSafePath(data.path)) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ error: 'Invalid or unsafe path' }));
                    }
                    const absolutePath = path.isAbsolute(data.path) 
                        ? path.resolve(data.path) 
                        : path.resolve(PROJECT_ROOT, data.path);
                    logToBridge(`[Agent Bridge] Triggering Native JIT RAG on path: ${absolutePath}`);
                    
                    try {
                        const files = await scanSector(absolutePath);
                        let count = 0;
                        for (const file of files) {
                            try {
                                const content = await fs.readFile(file, 'utf-8');
                                const title = path.basename(file);
                                if (systemDb) {
                                    await insert(systemDb, {
                                        id: `sector-${Date.now()}-${Math.random()}`,
                                        title: `Sector File: ${title}`,
                                        content: content,
                                        path: file
                                    });
                                    count++;
                                }
                            } catch (readErr) {
                                console.warn(`[Agent Bridge] Failed to read ${file}:`, readErr.message);
                            }
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, count, message: `Successfully ingested ${count} files from ${data.path}` }));
                    } catch (err) {
                        res.writeHead(500);
                        return res.end(JSON.stringify({ error: err.message }));
                    }
                }

                // Endpoint: Gemini API Mock Proxy
                if (pathname.startsWith('/v1beta/models/') || pathname.startsWith('/v1/models/')) {
                    if (bridgeConfig.useCloud) {
                        console.log(`[Agent Bridge Proxy] Forwarding request to Gemini API: ${pathname}`);
                        const apiRes = await fetch(`https://generativelanguage.googleapis.com${req.url}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-goog-api-key': geminiApiKey
                            },
                            body: JSON.stringify(data)
                        });
                        const resData = await apiRes.json();
                        res.writeHead(apiRes.status, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify(resData));
                    } else {
                        logToBridge(`[Agent Bridge Proxy] Intercepting Gemini request. Routing to Local Ollama: ${bridgeConfig.activeModel}`);
                        const ollamaPayload = geminiToOllama(data, bridgeConfig.activeModel);
                        
                        const ollamaRes = await fetch('http://localhost:11434/api/chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(ollamaPayload)
                        });
                        
                        if (!ollamaRes.ok) {
                            res.writeHead(ollamaRes.status);
                            return res.end(JSON.stringify({ error: `Ollama failed: ${ollamaRes.statusText}` }));
                        }
                        
                        const ollamaData = await ollamaRes.json();
                        const localTextResponse = ollamaData.message?.content || '';
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify(ollamaToGemini(localTextResponse)));
                    }
                }

                // Endpoint: /api/fs/read
                if (pathname === '/api/fs/read') {
                    if (!data.path || !isSafePath(data.path)) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ error: 'Invalid or unsafe path' }));
                    }
                    const resolvedPath = path.resolve(PROJECT_ROOT, data.path);
                    try {
                        const content = await fs.readFile(resolvedPath, 'utf-8');
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ content }));
                    } catch (readErr) {
                        if (readErr.code === 'ENOENT') {
                            res.writeHead(404);
                            return res.end(JSON.stringify({ error: 'File not found' }));
                        }
                        throw readErr; // Propagate other errors to the 500 handler
                    }
                }


                // Endpoint: /api/fs/write
                if (pathname === '/api/fs/write') {
                    if (!data.path || !isSafePath(data.path) || data.content === undefined) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ error: 'Invalid path or missing content' }));
                    }
                    const resolvedPath = path.resolve(PROJECT_ROOT, data.path);
                    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
                    
                    let contentToWrite = '';
                    try {
                        contentToWrite = typeof data.content === 'string' ? data.content : JSON.stringify(data.content, null, 2);
                    } catch (stringifyErr) {
                        contentToWrite = String(data.content);
                    }

                    await fs.writeFile(resolvedPath, contentToWrite, 'utf-8');

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true }));
                }

                // Endpoint: /api/lore/list_volumes
                if (pathname === '/api/lore/list_volumes') {
                    const loreDbPath = path.resolve(__dirname, 'lore-db');
                    // await fs.mkdir(loreDbPath, { recursive: true });
                    const files = await fs.readdir(loreDbPath);
                    const volumes = files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ volumes }));
                }

                // Endpoint: /api/lore/save_volume
                if (pathname === '/api/lore/save_volume') {
                    if (!data.chunks || !data.volumeId) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Missing chunks or volumeId' }));
                    }
                    
                    const safeVolumeId = data.volumeId.replace(/[^a-zA-Z0-9.-]/g, '_');
                    const lorePath = path.resolve(__dirname, 'lore-db', `${safeVolumeId}.json`);
                    
                    await fs.mkdir(path.dirname(lorePath), { recursive: true });
                    await fs.writeFile(lorePath, JSON.stringify(data.chunks, null, 2), 'utf-8');
                    
                    // Insert ONLY the new chunks into the active Lore DB
                     if (loreDb) {
                         for (const chunk of data.chunks) {
                             await insert(loreDb, {
                                 id: chunk.id,
                                 title: chunk.title,
                                 content: chunk.content,
                                 path: chunk.source
                             });
                         }
                     }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true }));
                }

                // Endpoint: /api/lore/save_map
                if (pathname === '/api/lore/save_map') {
                    if (!data.id || !data.title || !data.data || !data.source) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Missing map metadata' }));
                    }
                    const topoDbPath = path.resolve(__dirname, 'public/data/topology-db');
                    await fs.mkdir(topoDbPath, { recursive: true });
                    const safeId = data.id.replace(/[^a-zA-Z0-9.-]/g, '_');
                    await fs.writeFile(path.join(topoDbPath, `${safeId}.json`), JSON.stringify(data, null, 2), 'utf-8');
                    
                    if (loreDb) {
                         await insert(loreDb, {
                             id: data.id,
                             title: `Topology Map: ${data.title}`,
                             content: JSON.stringify(data.data),
                             path: data.source
                         });
                     }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true }));
                }

                // Endpoint: /api/exec
                if (pathname === '/api/exec') {
                    if (!data.command) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Missing command' }));
                    }
                    
                    // Basic safeguard against purely destructive commands
                    const dangerous = ['remove-item', 'rm ', 'del ', 'format ', 'rd '];
                    const cmdLower = data.command.toLowerCase();
                    if (dangerous.some(d => cmdLower.includes(d))) {
                        res.writeHead(403);
                        return res.end(JSON.stringify({ error: 'Potentially destructive command blocked by Agent Bridge.' }));
                    }
                    
                    const cwd = data.cwd && isSafePath(data.cwd) ? path.resolve(PROJECT_ROOT, data.cwd) : PROJECT_ROOT;
                    const binPath = path.resolve(__dirname, 'bin');
                    
                    // Execute using powershell natively, adding local bin to PATH
                    const env = { ...process.env, PATH: `${binPath};${process.env.PATH}` };
                    execFile('powershell.exe', ['-NoProfile', '-Command', data.command], { cwd, env }, (error, stdout, stderr) => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            stdout: stdout || '',
                            stderr: stderr || '',
                            error: error ? error.message : null
                        }));
                    });
                    return; 
                }


                // Persistent Observer Loop Process handle
                if (!global.observerProcess) {
                    global.observerProcess = null;
                }

                // Endpoint: /api/vision/loop (Start/Stop persistent temporal observation loop)
                if (pathname === '/api/vision/loop') {
                    const action = data.action || 'status'; // 'start', 'stop', 'status'
                    const interval = data.interval || 5;

                    if (action === 'start') {
                        if (global.observerProcess) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, message: 'Observer loop is already active', active: true }));
                        }
                        const observerScript = path.resolve(__dirname, '../../scripts/observer.py');
                        const { spawn } = require('child_process');
                        global.observerProcess = spawn('python', [observerScript, '--loop', '--interval', String(interval)], { cwd: path.resolve(__dirname, '../..') });
                        
                        console.log(`[Vision Bridge] 👁️ Started Persistent Temporal Observer Loop (Interval: ${interval}s, PID: ${global.observerProcess.pid})`);
                        
                        global.observerProcess.on('exit', () => {
                            console.log('[Vision Bridge] Persistent Observer Loop exited.');
                            global.observerProcess = null;
                        });

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, message: `Persistent visual loop started (${interval}s heartbeat)`, active: true }));
                    }

                    if (action === 'stop') {
                        if (global.observerProcess) {
                            global.observerProcess.kill();
                            global.observerProcess = null;
                            console.log('[Vision Bridge] 👁️ Stopped Persistent Temporal Observer Loop.');
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, message: 'Persistent visual loop stopped', active: false }));
                    }

                    // Status
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: true, active: !!global.observerProcess }));
                }

                // Endpoint: /api/vision/capture
                if (pathname === '/api/vision/capture') {
                    console.log('[Vision Bridge] Triggering on-demand scan via observer.py...');
                    try {
                        const observerScript = path.resolve(__dirname, '../../scripts/observer.py');
                        
                        await new Promise((resolve, reject) => {
                            execFile('python', [observerScript], { cwd: path.resolve(__dirname, '../..') }, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('[Vision Bridge Exec Error]', stderr || err.message);
                                    reject(err);
                                } else {
                                    resolve(stdout);
                                }
                            });
                        });

                        // Retrieve the latest visual memory node from SQLite
                        const dbPath = path.resolve(__dirname, '../../data/myos_vector_store.db');
                        let description = "Aetherial Vision Scan completed.";
                        
                        if (fsSync.existsSync(dbPath)) {
                            description = await new Promise((resolve) => {
                                const pyCode = "import sqlite3; conn = sqlite3.connect(r'" + dbPath + "'); c = conn.cursor(); c.execute(\"SELECT text FROM vectors WHERE type = 'visual_context' ORDER BY timestamp DESC LIMIT 1\"); row = c.fetchone(); print(row[0] if row and row[0] else 'Aetherial Vision Scan completed and vector node stored.'); conn.close()";
                                execFile('python', ['-c', pyCode], (err, stdout) => {
                                    if (!err && stdout && stdout.trim()) {
                                        resolve(stdout.trim());
                                    } else {
                                        resolve("Aetherial Vision Scan completed and vector node stored.");
                                    }
                                });
                            });
                        }

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ 
                            success: true, 
                            description: description
                        }));

                    } catch (err) {
                        console.error('[Vision Bridge Error]', err);
                        res.writeHead(500);
                        return res.end(JSON.stringify({ error: `Vision scan failed: ${err.message}` }));
                    }
                }

                // Endpoint: /api/character/synthesize (Universal Sovereign Character Synthesis)
                if (pathname === '/api/character/synthesize') {
                    console.log('[Character Synthesizer] Incoming synthesis request...');
                    try {
                        const recipe = data.recipe || data;
                        const charId = (recipe.id || recipe.name || 'custom_hero').toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        recipe.id = charId;

                        // Resolve relative web paths if passed as image_base64 or image_path
                        const publicDir = path.resolve(__dirname, 'public');
                        for (const key of ['image_path', 'image_base64']) {
                            const val = recipe[key];
                            if (typeof val === 'string' && (val.startsWith('/') || val.startsWith('assets') || val.startsWith('actions'))) {
                                const diskCandidate = path.resolve(publicDir, val.replace(/^\/+/, ''));
                                if (fsSync.existsSync(diskCandidate)) {
                                    recipe.image_path = diskCandidate;
                                    delete recipe.image_base64;
                                    break;
                                }
                            }
                        }
                        
                        const tempDir = path.resolve(__dirname, '../../temp_tiles');
                        await fs.mkdir(tempDir, { recursive: true });
                        const tmpRecipePath = path.resolve(tempDir, `recipe_${charId}_${Date.now()}.json`);
                        await fs.writeFile(tmpRecipePath, JSON.stringify(recipe, null, 2), 'utf-8');

                        const scriptPath = path.resolve(__dirname, '../../scripts/tools/flesh_synthesizer_pipeline.py');
                        const blenderExe = 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
                        const fullFlag = recipe.renderFull ? '--full' : '';

                        const cmd = `"${blenderExe}" -b --python "${scriptPath}" -- --recipe "${tmpRecipePath}" ${fullFlag}`;
                        console.log(`[Character Synthesizer] Executing: ${cmd}`);

                        const stdout = await new Promise((resolve, reject) => {
                            exec(cmd, { cwd: path.resolve(__dirname, '../..'), maxBuffer: 25 * 1024 * 1024 }, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('[Character Synthesizer Exec Error]', stderr || err.message);
                                    reject(new Error(stderr || err.message));
                                } else {
                                    if (stderr) console.warn('[Character Synthesizer Warnings]', stderr);
                                    resolve(stdout);
                                }
                            });
                        });

                        try { await fs.unlink(tmpRecipePath); } catch (_) {}

                        // Read updated manifest
                        const manifestPath = path.resolve(__dirname, 'public/textures/avatars/myos_sprites_manifest.json');
                        let registeredSprite = null;
                        try {
                            const manifestData = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
                            registeredSprite = manifestData.sprites?.[charId] || null;
                        } catch (_) {}

                        console.log(`[Character Synthesizer] ✅ Successfully synthesized: ${charId}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({
                            success: true,
                            spriteId: charId,
                            sprite: registeredSprite,
                            previewUrl: `/actions/${charId}_preview.png`
                        }));
                    } catch (err) {
                        console.error('[Character Synthesizer Error]', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: `Character synthesis failed: ${err.message}` }));
                    }
                }

                // Endpoint: /api/studio/manifest (Autonomous Studio Production Manifest Generation)
                if (pathname === '/api/studio/manifest') {
                    console.log('[Agent Bridge] Studio manifest generation requested...');
                    try {
                        const promptText = data.prompt || '1980s Bakshi/Frazetta dark high fantasy duel on a cliff plateau';
                        const model = data.model || bridgeConfig.activeModel || 'myos-cortex:latest';
                        const isOffline = !!data.offline;

                        const scriptPath = path.resolve(PROJECT_ROOT, 'scripts/tools/studio_agent_pipeline.py');
                        const tempManifestPath = path.resolve(PROJECT_ROOT, 'temp_studio_frames', `manifest_${Date.now()}.json`);
                        
                        await fs.mkdir(path.dirname(tempManifestPath), { recursive: true });

                        const timeoutSec = String(data.timeout || 35);
                        const args = [
                            scriptPath,
                            '--prompt', promptText,
                            '--model', model,
                            '--output', tempManifestPath,
                            '--timeout', timeoutSec,
                            '--json-stdout'
                        ];
                        if (isOffline) {
                            args.push('--offline');
                        }

                        console.log(`[Agent Bridge] Invoking studio_agent_pipeline: python ${args.join(' ')}`);

                        const stdout = await new Promise((resolve, reject) => {
                            execFile('python', args, { cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' }, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('[Agent Bridge] studio_agent_pipeline execution error:', stderr || err.message);
                                    if (fsSync.existsSync(tempManifestPath)) {
                                        try {
                                            const saved = JSON.parse(fsSync.readFileSync(tempManifestPath, 'utf-8'));
                                            return resolve(JSON.stringify(saved));
                                        } catch (_) {}
                                    }
                                    return reject(new Error(stderr || err.message));
                                }
                                resolve(stdout);
                            });
                        });

                        let manifest = null;
                        try {
                            manifest = JSON.parse(stdout.trim());
                        } catch (_) {
                            if (fsSync.existsSync(tempManifestPath)) {
                                manifest = JSON.parse(await fs.readFile(tempManifestPath, 'utf-8'));
                            }
                        }

                        if (!manifest) {
                            throw new Error('Failed to parse generated manifest');
                        }

                        try {
                            if (tempManifestPath.includes('manifest_') && fsSync.existsSync(tempManifestPath)) {
                                await fs.unlink(tempManifestPath);
                            }
                        } catch (_) {}

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({
                            success: true,
                            manifest
                        }));
                    } catch (err) {
                        console.error('[Agent Bridge Studio Error]', err);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({
                            success: false,
                            error: `Failed to generate studio manifest: ${err.message}`
                        }));
                    }
                }

                // Endpoint: /api/studio/produce (Autonomous Headless Blender Filming & PyAV Assembly)
                if (pathname === '/api/studio/produce') {
                    console.log('[Agent Bridge] Studio produce requested...');
                    try {
                        let manifest = data.manifest;
                        const isOffline = data.offline !== undefined ? !!data.offline : true;

                        // 1. Obtain manifest if not provided directly
                        if (!manifest) {
                            const promptText = data.prompt || '1980s Bakshi/Frazetta dark high fantasy duel on a cliff plateau';
                            const model = data.model || bridgeConfig.activeModel || 'myos-cortex:latest';
                            const pipelineScript = path.resolve(PROJECT_ROOT, 'scripts/tools/studio_agent_pipeline.py');
                            const tempManifestPath = path.resolve(PROJECT_ROOT, 'temp_studio_frames', `manifest_gen_${Date.now()}.json`);
                            await fs.mkdir(path.dirname(tempManifestPath), { recursive: true });

                            const pipelineArgs = [
                                pipelineScript,
                                '--prompt', promptText,
                                '--model', model,
                                '--output', tempManifestPath,
                                '--json-stdout'
                            ];
                            if (isOffline) {
                                pipelineArgs.push('--offline');
                            }

                            console.log(`[Agent Bridge Produce] Generating manifest: python ${pipelineArgs.join(' ')}`);
                            const manifestStdout = await new Promise((resolve, reject) => {
                                execFile('python', pipelineArgs, { cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024, encoding: 'utf-8' }, (err, stdout, stderr) => {
                                    if (err) {
                                        if (fsSync.existsSync(tempManifestPath)) {
                                            try {
                                                const saved = JSON.parse(fsSync.readFileSync(tempManifestPath, 'utf-8'));
                                                return resolve(JSON.stringify(saved));
                                            } catch (_) {}
                                        }
                                        return reject(new Error(stderr || err.message));
                                    }
                                    resolve(stdout);
                                });
                            });

                            try {
                                manifest = JSON.parse(manifestStdout.trim());
                            } catch (_) {
                                if (fsSync.existsSync(tempManifestPath)) {
                                    manifest = JSON.parse(await fs.readFile(tempManifestPath, 'utf-8'));
                                }
                            }

                            try { if (fsSync.existsSync(tempManifestPath)) await fs.unlink(tempManifestPath); } catch (_) {}
                        }

                        if (!manifest) {
                            throw new Error('Could not produce or parse manifest for production');
                        }

                        // Write manifest to active temp path for Blender
                        const framesDir = path.resolve(PROJECT_ROOT, 'temp_studio_frames');
                        await fs.mkdir(framesDir, { recursive: true });
                        const activeManifestPath = path.resolve(framesDir, `produce_manifest_${Date.now()}.json`);
                        await fs.writeFile(activeManifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

                        // Determine title and output video filename
                        const title = manifest.metadata?.title || 'Studio_Reel';
                        const safeTitle = title.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
                        const outputVideoName = `${safeTitle || 'reel'}.mp4`;
                        const screeningsDir = path.resolve(__dirname, 'public/screenings');
                        await fs.mkdir(screeningsDir, { recursive: true });
                        const outputVideoPath = path.resolve(screeningsDir, outputVideoName);

                        // 2. Spawn Blender 5.2 Headless Filming Engine
                        const blenderExe = 'C:\\Program Files\\Blender Foundation\\Blender 5.2\\blender.exe';
                        const filmScript = path.resolve(PROJECT_ROOT, 'scripts/tools/film_studio_reel.py');

                        const blenderArgs = [
                            '-b',
                            '-P', filmScript,
                            '--',
                            '--manifest', activeManifestPath
                        ];

                        console.log(`[Agent Bridge Produce] Executing Blender: "${blenderExe}" ${blenderArgs.join(' ')}`);
                        await new Promise((resolve, reject) => {
                            execFile(blenderExe, blenderArgs, { cwd: PROJECT_ROOT, maxBuffer: 50 * 1024 * 1024 }, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('[Agent Bridge Produce] Blender Filming Error:', stderr || err.message);
                                    return reject(new Error(`Blender filming failed: ${stderr || err.message}`));
                                }
                                console.log('[Agent Bridge Produce] Blender Filming Complete.');
                                resolve(stdout);
                            });
                        });

                        // 3. Spawn PyAV Video Reel Compiler
                        const pythonExe = 'C:\\Python313\\python.exe';
                        const stitchScript = path.resolve(PROJECT_ROOT, 'scripts/tools/stitch_studio_reel.py');
                        const fps = String(manifest.metadata?.fps || 24);

                        const stitchArgs = [
                            stitchScript,
                            '--frames-dir', framesDir,
                            '--output', outputVideoPath,
                            '--fps', fps
                        ];

                        console.log(`[Agent Bridge Produce] Compiling reel via PyAV: "${pythonExe}" ${stitchArgs.join(' ')}`);
                        await new Promise((resolve, reject) => {
                            execFile(pythonExe, stitchArgs, { cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
                                if (err) {
                                    console.error('[Agent Bridge Produce] PyAV Stitching Error:', stderr || err.message);
                                    return reject(new Error(`PyAV stitching failed: ${stderr || err.message}`));
                                }
                                console.log('[Agent Bridge Produce] PyAV Reel Compiled Successfully.');
                                resolve(stdout);
                            });
                        });

                        try { if (fsSync.existsSync(activeManifestPath)) await fs.unlink(activeManifestPath); } catch (_) {}

                        const videoUrl = `/screenings/${outputVideoName}`;
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({
                            success: true,
                            videoUrl,
                            manifest
                        }));

                    } catch (produceErr) {
                        console.error('[Agent Bridge Produce Fatal Error]', produceErr);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({
                            success: false,
                            error: produceErr.message
                        }));
                    }
                }

                // Endpoint: /api/telemetry/error (Automated Frontend Error Feedback)
                if (pathname === '/api/telemetry/error') {
                    try {
                        const errorRecord = {
                            timestamp: new Date().toISOString(),
                            message: data.message || 'Unknown Frontend Error',
                            stack: data.stack || '',
                            componentStack: data.componentStack || '',
                            url: data.url || ''
                        };
                        const logDir = path.join(WORKSPACE_ROOT, 'data');
                        const logPath = path.join(logDir, 'telemetry_errors.json');
                        let errors = [];
                        if (fsSync.existsSync(logPath)) {
                            try { errors = JSON.parse(fsSync.readFileSync(logPath, 'utf8')); } catch(e){}
                        } else if (!fsSync.existsSync(logDir)) {
                            fsSync.mkdirSync(logDir, { recursive: true });
                        }
                        errors.unshift(errorRecord);
                        if (errors.length > 50) errors = errors.slice(0, 50);
                        fsSync.writeFileSync(logPath, JSON.stringify(errors, null, 2), 'utf8');
                        console.error(`🚨 [FRONTEND TELEMETRY ERROR] ${errorRecord.message}`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true }));
                    } catch (err) {
                        res.writeHead(500);
                        return res.end(JSON.stringify({ error: err.message }));
                    }
                }

                 // Endpoint: /api/search (Orama Omni Index with isolation)
                 if (pathname === '/api/search') {
                     if (!systemDb || !loreDb) {
                         res.writeHead(503);
                         return res.end(JSON.stringify({ error: 'Orama DB not initialized yet' }));
                     }
                     if (!data.query) {
                         res.writeHead(400);
                         return res.end(JSON.stringify({ error: 'Missing query string' }));
                     }
                     
                     const index = data.index || 'all';
                     logToBridge(`[Agent Bridge Search] Query: "${data.query}", Target Index: ${index}`);
                     
                     let results;
                     if (index === 'system') {
                         results = await search(systemDb, {
                             term: data.query,
                             limit: data.limit || 5
                         });
                     } else if (index === 'lore') {
                         results = await search(loreDb, {
                             term: data.query,
                             limit: data.limit || 5
                         });
                     } else {
                         // Search both and merge
                         const sysRes = await search(systemDb, { term: data.query, limit: data.limit || 3 });
                         const loreRes = await search(loreDb, { term: data.query, limit: data.limit || 3 });
                         results = {
                             hits: [...(sysRes.hits || []), ...(loreRes.hits || [])].slice(0, data.limit || 5)
                         };
                     }
                     
                     res.writeHead(200, { 'Content-Type': 'application/json' });
                     return res.end(JSON.stringify({ results }));
                 }

                // Endpoint: /api/models/registry (Sovereign Model Registry)
                if (pathname === '/api/models/registry') {
                    const dbPath = path.resolve(PROJECT_ROOT, 'data/myos_vector_store.db');
                    const pyCode = "import sqlite3, json; conn = sqlite3.connect(r'" + dbPath + "'); c = conn.cursor(); c.execute('SELECT model_id, name, dominant_pillar, substrate_type, endpoint, system_role, vector_filter_types, is_active FROM model_registry'); rows = c.fetchall(); conn.close(); cols = ['model_id', 'name', 'dominant_pillar', 'substrate_type', 'endpoint', 'system_role', 'vector_filter_types', 'is_active']; print(json.dumps([dict(zip(cols, r)) for r in rows]))";
                    execFile('python', ['-c', pyCode], (err, stdout) => {
                        if (err) {
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: err.message }));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(stdout.trim());
                    });
                    return;
                }

                // Endpoint: /api/inode/stamp (Living Semantic Inode Generator & Stamper)
                if (pathname === '/api/inode/stamp') {
                    const targetFile = data.filePath;
                    if (!targetFile) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Missing filePath in request body' }));
                    }
                    const injectorScript = path.resolve(PROJECT_ROOT, 'scripts/tools/semantic_node_injector.py');
                    execFile('python', [injectorScript, targetFile, '--stamp'], (err, stdout) => {
                        if (err) {
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: err.message }));
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ success: true, log: stdout.trim() }));
                    });
                    return;
                }

                // Endpoint: /api/cortex/ask (Grounded Memory RAG Cortex Query)
                if (pathname === '/api/cortex/ask') {
                    const userQuery = data.query || data.prompt;
                    if (!userQuery) {
                        res.writeHead(400);
                        return res.end(JSON.stringify({ error: 'Missing query in request body' }));
                    }

                    const pythonScript = path.resolve(PROJECT_ROOT, 'scripts/tools/cortex_memory_bridge.py');
                    const child = spawn('python', [pythonScript, userQuery]);

                    let stdoutData = '';
                    let stderrData = '';

                    child.stdout.on('data', (d) => { stdoutData += d.toString(); });
                    child.stderr.on('data', (d) => { stderrData += d.toString(); });

                    child.on('close', (code) => {
                        if (code !== 0) {
                            console.error('[Cortex Bridge Error]', stderrData);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: "Cortex memory bridge failed: " + stderrData }));
                        }
                        try {
                            const parsed = JSON.parse(stdoutData.trim());
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify(parsed));
                        } catch (parseErr) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            return res.end(JSON.stringify({ success: true, response: stdoutData.trim() }));
                        }
                    });
                    return;
                }

                // Not found
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Endpoint not found' }));

            } catch (err) {
                console.error('[Agent Bridge Error]', err);
                res.writeHead(500);
                res.end(JSON.stringify({ error: err.message }));
            }
        });
    } else {
        res.writeHead(405);
        res.end('Method not allowed');
    }
});

// Start server and initialize Orama
server.listen(PORT, async () => {
    console.log(`[Agent Bridge] Listening on port ${PORT}`);
    console.log(`[Agent Bridge] Jailed to: ${PROJECT_ROOT}`);
    await loadEnv();
    await loadConfig();
    await initOrama();
});

