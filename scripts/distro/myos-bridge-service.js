#!/usr/bin/env node
// ==============================================================================
// MyOS Linux Host Filesystem Bridge Daemon
// Bridges $HOME files and directories into 3D Tri-cons and Sliding Door Portals.
// Runs on port 8081 inside the Linux live/installed system.
// ==============================================================================

import http from 'http';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

const PORT = 8081;
const HOST_HOME = process.env.HOME || '/home/myos';

console.log(`[MyOS Bridge] Initializing Linux Host Bridge for $HOME: ${HOST_HOME}`);

// Categorize file extensions into Tri-con types
function categorizeExtension(ext) {
    const clean = ext.replace('.', '').toLowerCase();
    if (['ts', 'tsx', 'js', 'jsx', 'py', 'rs', 'sh', 'c', 'cpp', 'html', 'css'].includes(clean)) return 'code';
    if (['md', 'txt', 'pdf', 'doc', 'docx', 'json', 'csv'].includes(clean)) return 'doc';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'mp4', 'mkv', 'wav', 'mp3', 'blend'].includes(clean)) return 'media';
    if (['tar', 'gz', 'zip', 'iso', 'deb', '7z'].includes(clean)) return 'archive';
    if (['env', 'yaml', 'yml', 'toml', 'cfg', 'conf', 'ini'].includes(clean)) return 'config';
    return 'unknown';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Scan directory into 3D Tri-cons and Sliding Door Portals
async function scanDirectory(targetDir, depth = 0) {
    const resolvedPath = path.resolve(HOST_HOME, targetDir.replace(/^\/+/, ''));
    
    // Security check: ensure path stays within $HOME
    if (!resolvedPath.startsWith(HOST_HOME)) {
        throw new Error('Access denied: Path outside $HOME directory');
    }

    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    const items = [];
    const directories = [];

    // Spatial layout parameters for 3D generation
    let fileIndex = 0;
    let dirIndex = 0;

    for (const entry of entries) {
        if (entry.name.startsWith('.')) continue; // skip hidden files

        const fullPath = path.join(resolvedPath, entry.name);
        const relPath = path.relative(HOST_HOME, fullPath);

        if (entry.isDirectory()) {
            // Position sliding doors along an arc or grid
            const angle = (dirIndex * 0.45) - 1.2;
            const dist = 8.5;
            const doorPos = [
                Math.sin(angle) * dist,
                0.1,
                Math.cos(angle) * dist + 2.0
            ];

            let subCount = 0;
            try {
                const sub = await fs.readdir(fullPath);
                subCount = sub.filter(s => !s.startsWith('.')).length;
            } catch (e) {}

            directories.push({
                id: `dir-${entry.name}`,
                name: entry.name,
                path: relPath,
                itemCount: subCount,
                position: doorPos
            });
            dirIndex++;
        } else if (entry.isFile()) {
            let size = '0 B';
            try {
                const stat = await fs.stat(fullPath);
                size = formatBytes(stat.size);
            } catch (e) {}

            const ext = path.extname(entry.name);
            const triconType = categorizeExtension(ext);

            // Lay out files on desk / shelf grid
            const col = fileIndex % 4;
            const row = Math.floor(fileIndex / 4);
            const posX = (col - 1.5) * 1.6;
            const posZ = 1.8 + row * 1.5;

            items.push({
                id: `file-${entry.name}`,
                name: entry.name,
                path: relPath,
                kind: 'file',
                type: triconType,
                size,
                position: [posX, 0.1, posZ]
            });
            fileIndex++;
        }
    }

    return {
        currentPath: path.relative(HOST_HOME, resolvedPath) || '/',
        directories,
        files: items
    };
}

const server = http.createServer(async (req, res) => {
    // CORS headers for local kiosk
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    // Endpoint: Get directory contents for 3D Tri-con layout
    if (url.pathname === '/api/fs/scan') {
        const queryDir = url.searchParams.get('dir') || '';
        try {
            const data = await scanDirectory(queryDir);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    // Endpoint: Open a file using Linux xdg-open
    if (url.pathname === '/api/fs/open' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const { filePath } = JSON.parse(body);
                const absPath = path.resolve(HOST_HOME, filePath);
                console.log(`[MyOS Bridge] Executing xdg-open on: ${absPath}`);
                exec(`xdg-open "${absPath}"`, (err) => {
                    if (err) console.warn('[MyOS Bridge] xdg-open error:', err.message);
                });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, path: absPath }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // Status heartbeat
    if (url.pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', home: HOST_HOME, uptime: process.uptime() }));
        return;
    }

    res.writeHead(404);
    res.end();
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`[MyOS Bridge] Sovereign Linux Filesystem Bridge active on http://127.0.0.1:${PORT}`);
});
